#!/usr/bin/env python3
# 孝端皇后九龙九凤冠 -> GLB（金累丝穹顶 + 龙/凤 + 珍珠 + 宝石）
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
from lib import *
from mathutils import Vector

purge()
OUT = os.path.join(ROOT, "site", "models", "phoenix-crown.glb")
random.seed(11)

gold = mat_pbr('Gold', metalness=1.0, roughness=0.32, base_color=(0.85, 0.65, 0.18, 1))
pearl = mat_pbr('Pearl', metalness=0.0, roughness=0.18, base_color=(0.96, 0.95, 0.92, 1))
gem_red = mat_pbr('GemR', metalness=0.0, roughness=0.12, base_color=(0.78, 0.10, 0.12, 1))
gem_blue = mat_pbr('GemB', metalness=0.0, roughness=0.12, base_color=(0.10, 0.25, 0.7, 1))
gem_green = mat_pbr('GemG', metalness=0.0, roughness=0.12, base_color=(0.10, 0.55, 0.25, 1))
king = mat_pbr('Kingfisher', metalness=0.0, roughness=0.4, base_color=(0.10, 0.45, 0.6, 1))

# 穹顶胎（半球）
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.36, segments=48, ring_count=32)
dome = bpy.context.object
bpy.context.view_layer.objects.active = dome
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.bisect(plane_co=(0, 0, 0.02), plane_no=(0, 0, 1),
                    use_fill=True)
bpy.ops.object.mode_set(mode='OBJECT')
dome.data.materials.append(gold)

# 前额金钿横带
bpy.ops.mesh.primitive_cube_add(size=1)
bar = bpy.context.object
bar.scale = (0.52, 0.05, 0.12)
bar.location = (0, -0.30, 0.10)
bar.data.materials.append(gold)

# 顶部大升龙（金色 S 形管）
top = bezier_tube([(0, 0.30, 0.34), (0.12, 0.34, 0.30), (0, 0.40, 0.18),
                   (-0.12, 0.34, 0.30), (0, 0.30, 0.34)], r=0.022, segs=8, name='topdragon')
top.data.materials.append(gold)

# 两侧行龙
for s in (1, -1):
    d = bezier_tube([(s * 0.10, 0.05, 0.32), (s * 0.26, 0.18, 0.28),
                     (s * 0.22, 0.30, 0.15), (s * 0.10, 0.28, 0.05)],
                    r=0.018, segs=8, name='drag')
    d.data.materials.append(gold)

# 凤（侧后，用环形管示意）
for s in (1, -1):
    ph = bezier_tube([(s * 0.18, -0.10, 0.20), (s * 0.30, -0.02, 0.10),
                      (s * 0.24, -0.18, 0.05)], r=0.014, segs=8, name='phoenix')
    ph.data.materials.append(gold)

# 博鬓（左右各三扇小金片）
for s in (1, -1):
    for k in range(3):
        bpy.ops.mesh.primitive_cube_add(size=1)
        f = bpy.context.object
        f.scale = (0.02, 0.16, 0.10)
        f.location = (s * 0.40, -0.18 - k * 0.0, 0.05 + k * 0.02)
        f.rotation_euler = (0, 0, s * 0.3)
        f.data.materials.append(gold)

# 点翠蓝片（穹顶点缀）
for _ in range(14):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.03, subdivisions=1)
    p = bpy.context.object
    ang = random.uniform(0, math.pi * 2)
    rr = random.uniform(0.1, 0.32)
    yy = random.uniform(-0.28, -0.05)
    p.location = (math.cos(ang) * rr, yy, math.sqrt(max(0, 0.34 ** 2 - rr ** 2 - yy ** 2)))
    p.data.materials.append(king)

# 珍珠（密集小白球铺于穹顶）
for _ in range(90):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.02, subdivisions=1)
    p = bpy.context.object
    ang = random.uniform(0, math.pi * 2)
    rr = random.uniform(0.06, 0.34)
    z = random.uniform(0.02, 0.34)
    yy = random.uniform(-0.30, 0.30)
    p.location = (math.cos(ang) * rr, yy, z)
    p.data.materials.append(pearl)

# 宝石（红蓝绿点缀）
gems = [gem_red, gem_blue, gem_green]
for _ in range(16):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.035, subdivisions=1)
    g = bpy.context.object
    ang = random.uniform(0, math.pi * 2)
    rr = random.uniform(0.1, 0.3)
    z = random.uniform(0.05, 0.33)
    yy = random.uniform(-0.28, 0.28)
    g.location = (math.cos(ang) * rr, yy, z)
    g.data.materials.append(random.choice(gems))

stand_up_auto([o for o in bpy.data.objects if o.type == 'MESH'])
export_glb(OUT)
print('phoenix-crown.glb written')
