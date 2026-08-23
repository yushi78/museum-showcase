#!/usr/bin/env python3
"""自然史穹顶厅中央主展位渲染。"""
import bpy,sys,os,math
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:];src=os.path.abspath(args[0]);out=os.path.abspath(args[1])
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);bpy.ops.import_scene.gltf(filepath=src)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']; cs=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
mn=Vector((min(v.x for v in cs),min(v.y for v in cs),min(v.z for v in cs)));mx=Vector((max(v.x for v in cs),max(v.y for v in cs),max(v.z for v in cs)));cen=(mn+mx)/2;size=max(mx-mn)
def mat(name,c,metal=0,rough=.5):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.metallic=metal;m.roughness=rough;return m
def aim(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
stone=mat('dark basalt floor',(.025,.032,.034),.08,.62);sand=mat('fossil platform',(.16,.12,.075),0,.75);steel=mat('bronze railing',(.16,.10,.035),.65,.3);wall=mat('natural history wall',(.035,.065,.062),0,.72)
# 椭圆中央低台
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=size*.52,depth=size*.025,location=(cen.x,cen.y,mn.z-size*.012));bpy.context.object.scale.y=.32;bpy.context.object.data.materials.append(sand)
bpy.ops.mesh.primitive_plane_add(size=size*5,location=(cen.x,cen.y,mn.z-size*.03));bpy.context.object.data.materials.append(stone)
# 后墙、拱肋、侧展柜形成自然史大空间
bpy.ops.mesh.primitive_cube_add(location=(cen.x,cen.y+size*.95,mn.z+size*.48),scale=(size*1.7,size*.035,size*.72));bpy.context.object.data.materials.append(wall)
for x in [-1.35,-.68,0,.68,1.35]:
 bpy.ops.mesh.primitive_torus_add(major_radius=size*.58,minor_radius=size*.012,major_segments=64,minor_segments=8,location=(cen.x+x*size,cen.y+size*.88,mn.z+size*.42),rotation=(math.pi/2,0,0));bpy.context.object.data.materials.append(steel)
# 围栏限定中央主展位
for y in (-size*.25,size*.25):
 for x in (-size*.48,size*.48):
  bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=size*.006,depth=size*.09,location=(cen.x+x,cen.y+y,mn.z+size*.045));bpy.context.object.data.materials.append(steel)
 for a,b in [((-size*.48,y),(size*.48,y))]:
  o=None
  from mathutils import Vector as V
  p1=V((cen.x+a[0],cen.y+a[1],mn.z+size*.08));p2=V((cen.x+b[0],cen.y+b[1],mn.z+size*.08));d=p2-p1
  bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=size*.004,depth=d.length,location=(p1+p2)/2);o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(steel)
# 入口侧说明牌
bpy.ops.mesh.primitive_cube_add(location=(cen.x+size*.18,cen.y-size*.38,mn.z+size*.055),scale=(size*.12,size*.035,size*.055));bpy.context.object.rotation_euler[0]=-.28;bpy.context.object.data.materials.append(steel)
# 相机看向中央主展位
bpy.ops.object.camera_add(location=cen+Vector((size*.86,-size*1.28,size*.48)));cam=bpy.context.object;cam.data.lens=56;aim(cam,cen+Vector((0,0,size*.04)));bpy.context.scene.camera=cam
gain=max(1,(size/3)**2)
for loc,e,ss in [((size*.2,-size*.4,size*.9),170,.75),((-size*.7,-size*.1,size*.55),85,.65),((size*.65,size*.3,size*.65),110,.7)]:
 bpy.ops.object.light_add(type='AREA',location=cen+Vector(loc));l=bpy.context.object;l.data.energy=e*gain;l.data.size=size*ss;aim(l,cen)
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1400;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=out;scene.world.color=(.004,.008,.009);scene.view_settings.look='AgX - Medium High Contrast'
bpy.ops.render.render(write_still=True);print('natural placement rendered',out)
