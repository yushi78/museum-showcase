#!/usr/bin/env python3
# 牛肩胛骨刻辞 -> GLB（带倾斜展示座）
import sys, os, math, bmesh
sys.path.insert(0, os.path.dirname(__file__))
from lib import *

purge()
OUT = os.path.join(ROOT, "site", "models", "oracle-bone.glb")

# ---------- 甲骨薄片 ----------
nx, ny = 22, 28
W, H = 0.26, 0.36
bm = bmesh.new()
uv = {}
for j in range(ny + 1):
    ty = j / ny
    y = ty * H
    w = 0.42 + 0.58 * (1 - ty)            # 上宽下窄（肩胛轮廓）
    w *= 1 + 0.18 * ty                    # 底部略外撇
    for i in range(nx + 1):
        tx = i / nx
        x = (tx - 0.5) * W * w
        z = 0.018 * math.sin(tx * math.pi) * (0.5 + 0.5 * (1 - ty))  # 轻微内凹
        v = bm.verts.new((x, y, z))
        uv[v.index] = (tx, ty)
bm.verts.ensure_lookup_table()
for j in range(ny):
    for i in range(nx):
        a = j * (nx + 1) + i; b = j * (nx + 1) + i + 1
        c = (j + 1) * (nx + 1) + i + 1; d = (j + 1) * (nx + 1) + i
        bm.faces.new((bm.verts[a], bm.verts[b], bm.verts[c], bm.verts[d]))
ul = bm.loops.layers.uv.verify()
for f in bm.faces:
    for l in f.loops:
        l[ul].uv = uv[l.vert.index]
me = bpy.data.meshes.new('bone'); bm.to_mesh(me); bm.free()
bone = bpy.data.objects.new('bone', me)
bpy.context.collection.objects.link(bone)
# 加厚度
bpy.context.view_layer.objects.active = bone
bpy.ops.object.modifier_add(type='SOLIDIFY')
mod = bone.modifiers[-1]; mod.thickness = 0.012; mod.use_even_offset = True
bpy.ops.object.modifier_apply(modifier=mod.name)
# 初始姿态：稍微倾斜靠在支架上
bone.rotation_euler = (math.radians(15), 0, math.radians(-6))
bone.location = (0, 0.05, 0.06)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ---------- 木质展示座 ----------
stand = rounded_box(0.34, 0.08, 0.22, r=0.01, name='stand_base')
stand.location.z = 0.04
support = rounded_box(0.32, 0.12, 0.04, r=0.005, name='stand_support')
support.rotation_euler = (math.radians(35), 0, 0)
support.location = (0, 0.10, 0.10)

wood = bpy.data.materials.new('Wood')
wood.use_nodes = True
b = next(n for n in wood.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
b.inputs['Base Color'].default_value = (0.18, 0.11, 0.06, 1)
b.inputs['Roughness'].default_value = 0.78
stand.data.materials.append(wood)
support.data.materials.append(wood)

# ---------- 材质 ----------
mat = mat_pbr('Bone', base_img='oracle.png', rough_img='oracle_rough.png',
              normal_img='oracle_normal.png',
              metalness=0.0, roughness=0.7, normal_strength=1.0)
bone.data.materials.append(mat)

# 整体归到底面
objs = [bone, stand, support]
for o in objs: o.select_set(True)
bpy.context.view_layer.objects.active = bone
bpy.ops.object.join()
merged = bpy.context.object
minz = min(v.co.z for v in merged.data.vertices)
merged.location.z -= minz
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
fix_normals(merged)
stand_up_auto([merged])

export_glb(OUT)
print('oracle-bone.glb written')
