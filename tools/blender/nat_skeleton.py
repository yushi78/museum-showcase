#!/usr/bin/env python3
"""合川马门溪龙科学骨架装架：19节颈椎、完整肋笼、肩带骨盆、四肢与支架。"""
import bpy,math,os,sys
sys.path.insert(0,os.path.dirname(__file__))
from lib import purge,mat_pbr,tube,bezier_tube,rounded_box,fix_normals,export_glb
OUT=r"D:\workButty小程序\museum-showcase\site\models\mamenchisaurus.glb"; purge()
bone=mat_pbr('warm fossil bone',base_color=(.58,.38,.19,1),roughness=.82)
darkbone=mat_pbr('mineralized dark bone',base_color=(.23,.13,.055,1),roughness=.9)
steel=mat_pbr('museum mounting steel',base_color=(.045,.055,.062,1),metalness=.8,roughness=.32)
void=mat_pbr('skull cavities',base_color=(.008,.006,.004,1),roughness=1)
def mat(o,m=bone): o.data.materials.append(m); return o
def ell(name,loc,scale,m=bone,sub=2):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc); o=bpy.context.object;o.name=name;o.scale=scale;mat(o,m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def rod(name,a,b,r,m=bone):
 o=tube(a,b,r=r);o.name=name;mat(o,m);return o
def vertebra(name,x,z,s,axis='x',spine=.42):
 ell(name+' centrum',(x,0,z),(.30*s,.24*s,.25*s),bone)
 rod(name+' neural spine',(x,0,z+.12*s),(x,0,z+spine*s),.055*s)
 for side in (-1,1): rod(name+' transverse process',(x,side*.08*s,z+.10*s),(x,side*.38*s,z+.22*s),.045*s)
 rod(name+' articulation',(x-.18*s,0,z+.08*s),(x+.25*s,0,z+.12*s),.05*s)
def rib(x,z,side,length):
 pts=[(x,side*.20,z+.05),(x-.05,side*(.55+length*.25),z-.40),(x+.12,side*(.45+length*.55),z-length)]
 o=bezier_tube(pts,.045,10,'curved thoracic rib');mat(o)
# 骨盆至肩部的12节背椎和完整肋笼
for i in range(12):
 t=i/11;x=-2.3+4.6*t;vertebra('dorsal vertebra',x,4.05,.95,spine=.72)
 for s in (-1,1):rib(x,4.02,s,1.35+.42*math.sin(math.pi*t))
# 19节极长颈椎，颈线缓慢抬升
neck=[]
for i in range(19):
 t=i/18;x=2.35+9.75*t;z=4.12+4.25*t**1.35-.22*math.sin(math.pi*t);sc=.95-.48*t
 vertebra('elongate cervical vertebra',x,z,sc,spine=.48);neck.append((x,z,sc))
 if i>0:
  px,pz,ps=neck[i-1];rod('overlapping cervical rib',(px,0,pz-.12),(x+.42*sc,0,z-.18),.035*sc,darkbone)
# 荐椎、尾椎与人字骨
for i in range(5):vertebra('sacral vertebra',-2.55-i*.34,4.0,1.02,spine=.62)
for i in range(38):
 t=i/37;x=-3.0-10.0*t;z=3.95-2.85*t**1.1;sc=max(.14,.92*(1-t)**.72)
 vertebra('caudal vertebra',x,z,sc,spine=.38)
 if i<28 and i%2==0:rod('caudal chevron',(x,0,z-.12*sc),(x-.10,0,z-.48*sc),.035*max(sc,.35))
# 头骨：颅顶、吻部、上下颌、眼眶与鼻孔
ell('cranial vault',(12.48,0,8.48),(.52,.38,.34));ell('muzzle',(12.90,0,8.39),(.47,.42,.25))
rod('lower jaw',(12.18,-.34,8.24),(13.20,-.34,8.20),.075);rod('lower jaw',(12.18,.34,8.24),(13.20,.34,8.20),.075)
for s in (-1,1):
 ell('large orbit',(12.47,s*.35,8.52),(.17,.055,.16),void);ell('narial opening',(12.87,s*.39,8.48),(.10,.04,.075),void)
 for k in range(7):rod('pencil tooth',(12.72+k*.065,s*.30,8.23),(12.72+k*.065,s*.30,8.11),.012)
# 肩带与骨盆扁骨
for s in (-1,1):
 rod('scapula',(2.05,s*.48,4.22),(.65,s*.78,2.80),.15)
 ell('coracoid',(1.15,s*.72,2.95),(.48,.16,.55))
 ell('ilium',(-2.55,s*.48,3.92),(1.02,.18,.48))
 rod('pubis',(-2.45,s*.45,3.75),(-1.80,s*.60,2.42),.13);rod('ischium',(-2.70,s*.42,3.72),(-3.35,s*.55,2.50),.12)
# 四肢：肱骨/桡尺骨与股骨/胫腓骨、腕踝及趾骨
def leg(prefix,x,s,top,hind):
 y=s*(.72 if not hind else .82); knee=(x+(.25 if hind else .10),y,2.05)
 rod(prefix+' upper bone',(x,y,top),knee,.20 if hind else .16)
 rod(prefix+' lower bone A',knee,(x+.08,y-.05*s,.48),.135 if hind else .11)
 rod(prefix+' lower bone B',(knee[0],y+.10*s,knee[2]),(x+.25,y+.09*s,.48),.085)
 ell(prefix+' joint',knee,(.24,.20,.22));ell(prefix+' wrist ankle',(x+.16,y,.42),(.23,.19,.16))
 for k in range(5):
  yy=y+s*(k-2)*.09;rod(prefix+' digit',(x+.12,yy,.30),(x+.48-.04*abs(k-2),yy,.18),.035)
for s in (-1,1):leg('forelimb',1.65,s,3.95,False);leg('hindlimb',-2.05,s,4.02,True)
# 黑色博物馆支架：少量立柱和斜撑，不遮挡主体
for x,z in [(-2.4,4.0),(1.8,4.0),(6.7,6.0),(10.6,7.8),(-7.2,2.7),(-11.2,1.4)]:
 rod('steel support',(x,0,0),(x,0,z-.18),.055,steel)
 if abs(x)>3:rod('diagonal steel brace',(x,0,z-.3),(x*.48,0,3.85),.04,steel)
export_glb(OUT);print('Mamenchisaurus skeletal mount exported',OUT)
