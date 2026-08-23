#!/usr/bin/env python3
# 明成化斗彩鸡缸杯 -> GLB
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lib import *

purge()
OUT = os.path.join(ROOT, "site", "models", "chenghua-chicken-cup.glb")

# 鸡缸杯（真实比例，单位米）：小、薄、撇口、卧足
profile = [
    (0.030, 0.000), (0.036, 0.012), (0.044, 0.022),
    (0.050, 0.030), (0.050, 0.036), (0.047, 0.041), (0.052, 0.044),
]
body = lathe(profile, segs=64, name='cup', caps='bottom')
mat = mat_pbr('Doucai', base_img='chicken_cup.png', rough_img='chicken_cup_rough.png',
              normal_img='chicken_cup_normal.png', metalness=0.0, roughness=0.14,
              normal_strength=0.5)
body.data.materials.append(mat)

stand_up_auto([o for o in bpy.data.objects if o.type == 'MESH'])
export_glb(OUT)
print('chenghua-chicken-cup.glb written')
