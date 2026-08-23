#!/usr/bin/env python3
"""Build the exhibit Go2 from Unitree's official BSD-3-Clause MJCF assets.

The visual meshes and body transforms come from unitreerobotics/unitree_mujoco.
Only web optimisation, exhibit pose, materials and export are authored here.
"""
import bpy, os, sys, math, xml.etree.ElementTree as ET
from mathutils import Matrix, Vector, Quaternion

HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ASSET_ROOT = os.path.join(ROOT, 'tools', 'external', 'unitree_mujoco', 'unitree_robots', 'go2')
XML_PATH = os.path.join(ASSET_ROOT, 'go2.xml')
OUT = os.path.join(ROOT, 'site', 'models', 'robot-dog.glb')
sys.path.insert(0, HERE)
from lib import purge, mat_pbr, export_glb

def vec(text, default=(0,0,0)):
    return tuple(float(x) for x in text.split()) if text else default

def transform(el):
    p = vec(el.get('pos'))
    qv = vec(el.get('quat'), (1,0,0,0))
    q = Quaternion((qv[0], qv[1], qv[2], qv[3]))
    return Matrix.Translation(Vector(p)) @ q.to_matrix().to_4x4()

def material(name, rgba):
    return mat_pbr(name, metalness=.42 if name in ('gray','metal') else .12,
                   roughness=.27, base_color=rgba)

purge()
tree = ET.parse(XML_PATH)
root = tree.getroot()
mesh_files = {m.get('name', os.path.splitext(os.path.basename(m.get('file')))[0]): m.get('file')
              for m in root.findall('./asset/mesh')}
mats = {
    'black': material('Go2 black engineering polymer', (.018,.022,.026,1)),
    'white': material('Go2 silver-white shell', (.68,.72,.75,1)),
    'gray': material('Go2 anodized joint alloy', (.32,.35,.38,1)),
    'metal': material('Go2 motor metal', (.52,.56,.58,1)),
}

objects=[]
def visit_body(body, parent_matrix):
    world = parent_matrix @ transform(body)
    for geom in body.findall('geom'):
        mesh_name = geom.get('mesh')
        if not mesh_name:
            continue
        file_name = mesh_files.get(mesh_name, mesh_name + '.obj')
        path = os.path.join(ASSET_ROOT, 'assets', file_name)
        if not os.path.exists(path):
            raise FileNotFoundError(path)
        before=set(bpy.data.objects)
        # MJCF and the supplied OBJ files share a Z-up frame.  Preserve that
        # frame so the nested body transforms assemble the joints correctly.
        bpy.ops.wm.obj_import(filepath=path, forward_axis='X', up_axis='Z')
        imported=[o for o in bpy.data.objects if o not in before and o.type=='MESH']
        local = transform(geom)
        for obj in imported:
            obj.name = body.get('name','body') + '_' + mesh_name
            obj.matrix_world = world @ local @ obj.matrix_world
            obj.data.materials.clear()
            obj.data.materials.append(mats.get(geom.get('material','black'), mats['black']))
            for poly in obj.data.polygons: poly.use_smooth=True
            # Official visual mesh is dense; retain silhouette while targeting web delivery.
            if len(obj.data.polygons) > 4500:
                dec=obj.modifiers.new('web topology','DECIMATE'); dec.ratio=max(.04,4500/len(obj.data.polygons))
                dec.use_collapse_triangulate=True
            objects.append(obj)
    for child in body.findall('body'):
        visit_body(child, world)

worldbody=root.find('worldbody')
for body in worldbody.findall('body'):
    visit_body(body, Matrix.Identity(4))

# Apply transforms/modifiers and rest the official model on the exhibit floor.
for obj in objects:
    bpy.context.view_layer.objects.active=obj; obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for mod in list(obj.modifiers):
        bpy.context.view_layer.objects.active=obj; bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)

# Normalize the complete official assembly to Unitree's published standing
# envelope (700 x 310 x 400 mm).  This also prevents importer axis conventions
# from turning the exhibit into a nearly cubic, unnaturally tall robot.
corners=[obj.matrix_world @ Vector(c) for obj in objects for c in obj.bound_box]
mn=Vector((min(v.x for v in corners),min(v.y for v in corners),min(v.z for v in corners)))
mx=Vector((max(v.x for v in corners),max(v.y for v in corners),max(v.z for v in corners)))
span=mx-mn
sx,sy,sz=.7/span.x,.31/span.y,.4/span.z
for obj in objects:
    obj.scale.x*=sx; obj.scale.y*=sy; obj.scale.z*=sz
    bpy.context.view_layer.objects.active=obj; obj.select_set(True)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); obj.select_set(False)

min_z=min((obj.matrix_world @ Vector(c)).z for obj in objects for c in obj.bound_box)
for obj in objects: obj.location.z -= min_z

os.makedirs(os.path.dirname(OUT),exist_ok=True)
export_glb(OUT)
print('official Unitree Go2 exported:', OUT, 'objects=',len(objects))
