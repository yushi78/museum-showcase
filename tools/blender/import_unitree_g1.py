#!/usr/bin/env python3
"""Build the G1 exhibit from Unitree's official BSD-3-Clause URDF/STL assets."""
import bpy, os, sys, xml.etree.ElementTree as ET
from mathutils import Matrix, Vector, Euler

HERE=os.path.dirname(__file__)
ROOT=os.path.abspath(os.path.join(HERE,'..','..'))
DESC=os.path.join(ROOT,'tools','external','unitree_ros','robots','g1_description')
URDF=os.path.join(DESC,'g1_23dof_rev_1_0.urdf')
OUT=os.path.join(ROOT,'site','models','humanoid-robot.glb')
sys.path.insert(0,HERE)
from lib import purge, mat_pbr, export_glb

def nums(text, default=(0,0,0)):
    return tuple(float(x) for x in text.split()) if text else default

def origin(el):
    if el is None: return Matrix.Identity(4)
    xyz=nums(el.get('xyz')); rpy=nums(el.get('rpy'))
    return Matrix.Translation(Vector(xyz)) @ Euler(rpy,'XYZ').to_matrix().to_4x4()

purge(); robot=ET.parse(URDF).getroot()
palette={}
for m in robot.findall('material'):
    color=m.find('color'); rgba=nums(color.get('rgba'),(.7,.7,.7,1)) if color is not None else (.7,.7,.7,1)
    palette[m.get('name')]=mat_pbr('G1 '+m.get('name'),metalness=.35,roughness=.3,base_color=rgba)
palette.setdefault('dark',mat_pbr('G1 black joints',metalness=.45,roughness=.26,base_color=(.035,.04,.045,1)))
palette.setdefault('white',mat_pbr('G1 silver shell',metalness=.28,roughness=.3,base_color=(.68,.71,.72,1)))

links={x.get('name'):x for x in robot.findall('link')}
children={}
child_names=set()
for joint in robot.findall('joint'):
    parent=joint.find('parent').get('link'); child=joint.find('child').get('link')
    children.setdefault(parent,[]).append((child,origin(joint.find('origin')))); child_names.add(child)
roots=[name for name in links if name not in child_names]
objects=[]

def load_link(name,world):
    link=links[name]
    for idx,visual in enumerate(link.findall('visual')):
        mesh=visual.find('./geometry/mesh')
        if mesh is None: continue
        filename=mesh.get('filename').replace('package://g1_description/','').replace('meshes/','')
        path=os.path.join(DESC,'meshes',filename)
        if not os.path.exists(path): raise FileNotFoundError(path)
        before=set(bpy.data.objects); ext=os.path.splitext(path)[1].lower()
        if ext=='.stl': bpy.ops.wm.stl_import(filepath=path)
        elif ext=='.dae': bpy.ops.wm.collada_import(filepath=path)
        else: raise ValueError(ext)
        imported=[o for o in bpy.data.objects if o not in before and o.type=='MESH']
        scale=nums(mesh.get('scale'),(1,1,1)); sm=Matrix.Diagonal(Vector((*scale,1)))
        mat_el=visual.find('material'); mat_name=mat_el.get('name') if mat_el is not None else 'white'
        for obj in imported:
            obj.name=name if idx==0 else f'{name}_{idx}'
            obj.matrix_world=world @ origin(visual.find('origin')) @ sm @ obj.matrix_world
            obj.data.materials.clear(); obj.data.materials.append(palette.get(mat_name,palette['white']))
            for p in obj.data.polygons: p.use_smooth=True
            if len(obj.data.polygons)>5000:
                dec=obj.modifiers.new('web topology','DECIMATE'); dec.ratio=max(.06,5000/len(obj.data.polygons)); dec.use_collapse_triangulate=True
            objects.append(obj)
    for child,joint_tf in children.get(name,[]): load_link(child,world @ joint_tf)

for root_name in roots: load_link(root_name,Matrix.Identity(4))
for obj in objects:
    bpy.context.view_layer.objects.active=obj; obj.select_set(True)
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    for mod in list(obj.modifiers): bpy.context.view_layer.objects.active=obj; bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)
min_z=min((o.matrix_world @ Vector(c)).z for o in objects for c in o.bound_box)
for o in objects: o.location.z-=min_z
# 宇树 URDF 前=+X，展品约定前=+Z；整体绕 Z 转 -90° 让「前」朝 +Z（glTF y-up 下即绕 Y 转 -90°）
import math
for o in objects:
    o.select_set(True); bpy.context.view_layer.objects.active=o
    o.rotation_euler=(0,0,-math.pi/2)
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=False)
    o.select_set(False)
export_glb(OUT)
print('official Unitree G1 exported:',OUT,'objects=',len(objects))
