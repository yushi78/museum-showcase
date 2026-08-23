#!/usr/bin/env python3
# 元青花萧何月下追韩信梅瓶 -> GLB
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lib import *

purge()
OUT = os.path.join(ROOT, "site", "models", "yuan-blue-vase.glb")

# 梅瓶轮廓（真实比例，单位米）：小口、丰肩、敛胫
profile = [
    (0.075, 0.000), (0.086, 0.018), (0.100, 0.055),
    (0.130, 0.170), (0.122, 0.280), (0.078, 0.360),
    (0.052, 0.402), (0.050, 0.430), (0.064, 0.446), (0.057, 0.452),
]
body = lathe(profile, segs=72, name='meiping', caps='bottom')
# 口沿小唇
mat = mat_pbr('Porcelain', base_img='yuan_blue.png', rough_img='yuan_blue_rough.png',
              normal_img='yuan_blue_normal.png', metalness=0.0, roughness=0.12,
              normal_strength=0.5, base_color=(1, 1, 1, 1))
body.data.materials.append(mat)

# 唇口环
bpy.ops.mesh.primitive_torus_add(major_radius=0.057, minor_radius=0.006,
                                  major_segments=48, minor_segments=8)
lip = bpy.context.object; lip.location.z = 0.452
lip.data.materials.append(mat)

stand_up_auto([o for o in bpy.data.objects if o.type == 'MESH'])
export_glb(OUT)
print('yuan-blue-vase.glb written')
