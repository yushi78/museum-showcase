#!/usr/bin/env python3
"""Neutral turntable-style render for per-model visual QA.
Usage: blender -b --python render_glb.py -- input.glb output.png
"""
import bpy, sys, os, math
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
src=os.path.abspath(args[0]); out=os.path.abspath(args[1])
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=src)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
corners=[o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
mn=Vector((min(v.x for v in corners),min(v.y for v in corners),min(v.z for v in corners)))
mx=Vector((max(v.x for v in corners),max(v.y for v in corners),max(v.z for v in corners)))
center=(mn+mx)/2; size=max(mx-mn)

bpy.ops.object.camera_add(location=center+Vector((size*1.55,-size*1.8,size*.95)))
cam=bpy.context.object; bpy.context.scene.camera=cam
def point_at(obj, target): obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
point_at(cam,center); cam.data.lens=58
light_gain=max(1.0,(size/3.0)**2)
for loc,energy,scale in [((size*1.4,-size*.8,size*1.8),380,4),((-size,0,size*.8),170,3),((0,size,size*1.4),240,3)]:
    bpy.ops.object.light_add(type='AREA',location=center+Vector(loc)); lamp=bpy.context.object; lamp.data.energy=energy; lamp.data.shape='DISK'; lamp.data.size=size*scale/3; point_at(lamp,center)
    lamp.data.energy=energy*light_gain
bpy.ops.mesh.primitive_plane_add(size=size*8,location=(center.x,center.y,mn.z-size*.02)); floor=bpy.context.object
mat=bpy.data.materials.new('floor'); mat.diffuse_color=(.018,.022,.028,1); mat.metallic=.05; mat.roughness=.42; floor.data.materials.append(mat)
scene=bpy.context.scene; scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=1000; scene.render.resolution_y=800; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.filepath=out
scene.world.color=(.015,.018,.024); scene.view_settings.look='AgX - Medium High Contrast'
bpy.ops.render.render(write_still=True)
print('rendered',out)
