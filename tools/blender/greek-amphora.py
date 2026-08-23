#!/usr/bin/env python3
# 泛雅典娜奖瓶（黑绘双耳瓶）-> GLB
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lib import *

purge()
OUT = os.path.join(ROOT, "site", "models", "greek-amphora.glb")

# 颈式双耳瓶轮廓（真实比例，单位米）
profile = [
    (0.050, 0.000), (0.070, 0.040), (0.100, 0.120),
    (0.130, 0.300), (0.120, 0.450), (0.050, 0.520),
    (0.042, 0.720), (0.070, 0.840), (0.078, 0.870),
]
body = lathe(profile, segs=72, name='amphora', caps='bottom')
mat = mat_pbr('Terracotta', base_img='amphora.png', rough_img='amphora_rough.png',
              normal_img='amphora_normal.png', metalness=0.0, roughness=0.55,
              normal_strength=0.9)
body.data.materials.append(mat)

# 双耳（从颈部到肩部的大弧）
for s in (1, -1):
    h = bezier_tube([(s * 0.05, 0.80, 0), (s * 0.165, 0.66, 0),
                     (s * 0.16, 0.52, 0), (s * 0.07, 0.46, 0)],
                    r=0.018, segs=10, name='handle')
    h.data.materials.append(mat)

stand_up_auto([o for o in bpy.data.objects if o.type == 'MESH'])
export_glb(OUT)
print('greek-amphora.glb written')
