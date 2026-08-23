#!/usr/bin/env python3
"""Render one GLB as a museum-display photograph in its matching hall."""
import bpy,sys,os,math
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
src=os.path.abspath(args[0]); out=os.path.abspath(args[1]); hall=args[2] if len(args)>2 else 'classical'
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=src)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
corners=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
mn=Vector((min(v.x for v in corners),min(v.y for v in corners),min(v.z for v in corners)))
mx=Vector((max(v.x for v in corners),max(v.y for v in corners),max(v.z for v in corners)))
center=(mn+mx)/2; dims=mx-mn; size=max(dims); bottom=mn.z

def material(name,color,metal=0,rough=.45):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.metallic=metal; m.roughness=rough; return m
def point_at(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()

# Stone plinth, burgundy gallery wall and restrained bronze architectural trim.
stone=material('dark museum stone',(.055,.06,.065),.08,.3)
red=material('classical wall',(.11,.012,.015),0,.52)
gold=material('bronze trim',(.32,.15,.025),.65,.28)
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=size*.48,depth=size*.12,location=(center.x,center.y,bottom-size*.06))
bpy.context.object.data.materials.append(stone)
bpy.ops.mesh.primitive_plane_add(size=size*8,location=(center.x,center.y,bottom-size*.12)); bpy.context.object.data.materials.append(stone)
bpy.ops.mesh.primitive_cube_add(location=(center.x,center.y+size*1.25,bottom+size*.85),scale=(size*2.8,size*.05,size*1.35)); bpy.context.object.data.materials.append(red)
for x in (-size*1.35,size*1.35):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=size*.075,depth=size*2.2,location=(center.x+x,center.y+size*1.12,bottom+size*1.0)); bpy.context.object.data.materials.append(gold)

bpy.ops.object.camera_add(location=center+Vector((size*1.45,-size*2.25,size*.58)))
cam=bpy.context.object; cam.data.lens=62; point_at(cam,center); bpy.context.scene.camera=cam
light_gain=max(1.0,(size/3.0)**2)
for loc,energy,scale in [((size*.65,-size*.8,size*1.65),900,1.2),((-size*.9,-size*.2,size*.8),500,1.0),((0,size*.4,size*1.3),650,1.1)]:
    bpy.ops.object.light_add(type='AREA',location=center+Vector(loc)); l=bpy.context.object; l.data.energy=energy; l.data.size=size*scale; point_at(l,center)
    l.data.energy=energy*light_gain
scene=bpy.context.scene; scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=1200; scene.render.resolution_y=900; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.filepath=out; scene.world.color=(.008,.006,.008); scene.view_settings.look='AgX - Medium High Contrast'
bpy.ops.render.render(write_still=True); print('rendered hall image',out)
