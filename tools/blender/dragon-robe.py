#!/usr/bin/env python3
import bpy,math,os,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from lib import purge,mat_pbr,bezier_tube,rounded_box,export_glb
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..')); OUT=os.path.join(ROOT,'site','models','dragon-robe.glb'); purge()
yellow=mat_pbr('imperial yellow kesi silk',base_color=(.92,.54,.035,1),roughness=.52)
blue=mat_pbr('midnight blue woven borders',base_color=(.018,.045,.16,1),roughness=.48)
gold=mat_pbr('gold couching thread',base_color=(1,.55,.045,1),metalness=.35,roughness=.3)
cyan=mat_pbr('blue green wave silk',base_color=(.02,.27,.48,1),roughness=.5); red=mat_pbr('vermilion cloud silk',base_color=(.72,.025,.018,1),roughness=.5)
outline=[(-.61,.08),(-.57,.72),(-.98,.82),(-1.02,1.07),(-.92,1.28),(-.42,1.43),(-.25,1.53),(-.12,1.57),(.12,1.57),(.25,1.53),(.42,1.43),(.92,1.28),(1.02,1.07),(.98,.82),(.57,.72),(.61,.08)]
verts=[]
for y in (-.042,.042): verts += [(x,y,z) for x,z in outline]
n=len(outline); faces=[tuple(range(n)),tuple(range(2*n-1,n-1,-1))]
for i in range(n): j=(i+1)%n; faces.append((i,j,n+j,n+i))
me=bpy.data.meshes.new('continuous robe cloth'); me.from_pydata(verts,[],faces); me.update(); robe=bpy.data.objects.new('flat mounted dragon robe',me); bpy.context.collection.objects.link(robe); robe.data.materials.append(yellow)
def box(name,w,d,h,x,y,z,material,rot=0):
    o=rounded_box(w,d,h,.015,4,name); o.location=(x,y,z); o.rotation_euler[1]=rot; o.data.materials.append(material); return o
bpy.ops.mesh.primitive_torus_add(major_radius=.125,minor_radius=.035,major_segments=40,minor_segments=10,location=(0,-.058,1.5),rotation=(math.pi/2,0,0)); bpy.context.object.data.materials.append(blue)
box('right closing diagonal border',.055,.025,.82,.18,-.061,1.12,blue,-.34)
for s in (-1,1): box('horseshoe cuff',.22,.07,.29,s*.94,-.055,.96,blue,s*.13); box('dark sleeve join',.19,.025,.34,s*.72,-.058,1.13,blue,s*.42)
def dragon(cx,cz,sc,flip=1):
    pts=[(cx-.25*sc*flip,-.073,cz-.02*sc),(cx-.11*sc*flip,-.079,cz+.13*sc),(cx+.05*sc*flip,-.078,cz+.03*sc),(cx+.18*sc*flip,-.076,cz+.15*sc),(cx+.27*sc*flip,-.073,cz+.02*sc)]
    bezier_tube(pts,.018*sc,10,'five claw dragon body').data.materials.append(gold)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=.065*sc,location=pts[-1]); head=bpy.context.object; head.scale=(1.15,.32,.82); head.data.materials.append(gold)
    for k,p in enumerate(pts[1:4]):
        for dz in (-1,1): bezier_tube([p,(p[0]+flip*(.07+.015*k)*sc,p[1]-.002,p[2]+dz*.09*sc)],.009*sc,8,'dragon claw').data.materials.append(gold)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.025*sc,location=(pts[-1][0]+flip*.1*sc,-.08,pts[-1][2]+.07*sc)); bpy.context.object.data.materials.append(red)
dragon(0,1.27,.72,1); dragon(-.28,.69,.58,-1); dragon(.28,.69,.58,1)
for s in (-1,1): dragon(s*.72,1.13,.34,-s)
for i,(x,z) in enumerate([(-.43,1.31),(.43,1.31),(-.48,1.05),(.48,1.05),(-.46,.84),(.46,.84),(-.42,.52),(.42,.52),(-.30,.33),(.30,.33),(-.16,.18),(.16,.18)]):
    bpy.ops.mesh.primitive_cylinder_add(vertices=4,radius=.034,depth=.012,location=(x,-.071,z),rotation=(math.pi/2,0,math.pi/4)); symbol=bpy.context.object; symbol.name='twelve imperial symbol'; symbol.data.materials.append(gold if i%3 else red)
for row in range(5):
    z=.10+row*.055; points=[(-.55+i*.069,-.073,z+.018*math.sin(i*math.pi/2+row*.65)) for i in range(17)]; bezier_tube(points,.012,8,'sea wave embroidery').data.materials.append(cyan if row%2==0 else blue)
for s in (-1,1): bezier_tube([(s*.02,-.075,.11),(s*.13,-.076,.32),(s*.25,-.075,.11)],.016,8,'mountain peak').data.materials.append(gold)
for i in range(4): bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.018,location=(.25,-.082,1.36-i*.18)); bpy.context.object.data.materials.append(gold)
export_glb(OUT); print('dragon-robe.glb written')
