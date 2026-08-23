#!/usr/bin/env python3
# 自然馆标本：深海头足类浸制标本罐、蝴蝶甲虫标本柜
import bpy, math, os, sys, random
sys.path.insert(0, os.path.dirname(__file__))
from lib import (purge, mat_pbr, rounded_box, tube, bezier_tube, fix_normals, export_glb, stand_up_rotate_x)

MODELS = r"D:\workButty小程序\museum-showcase\site\models"
random.seed(42)


def blob(rx, ry, rz, segs=20, name='blob'):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=segs, ring_count=max(10, segs // 2))
    o = bpy.context.object; o.name = name
    o.scale = (rx, ry, rz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return o


# ---------------- 浸制标本罐 ----------------
def build_jar():
    meshes = []
    glass = mat_pbr('Glass', transmission=0.92, roughness=0.05, ior=1.45,
                    base_color=(0.80, 0.88, 0.90, 1), metalness=0.0)
    liquid = mat_pbr('Liquid', base_color=(0.88, 0.84, 0.62, 1), roughness=0.2, alpha=0.55)
    spec = mat_pbr('Ceph', base_color=(0.92, 0.72, 0.72, 1), roughness=0.4, alpha=0.85)
    lid = mat_pbr('Lid', metalness=0.7, roughness=0.4, base_color=(0.30, 0.30, 0.32, 1))

    jar = tube((0, 0.0, 0), (0, 1.35, 0), r=0.6, segs=36, name='jar')
    # tube 是实心圆柱，改成开口：用圆柱壁太复杂，直接实心玻璃柱（视觉可接受）
    jar.data.materials.append(glass); meshes.append(jar)
    cap = tube((0, 1.35, 0), (0, 1.5, 0), r=0.62, segs=36, name='cap')
    cap.data.materials.append(lid); meshes.append(cap)
    # 液体
    liq = tube((0, 0.05, 0), (0, 1.25, 0), r=0.56, segs=32, name='liq')
    liq.data.materials.append(liquid); meshes.append(liq)
    # 头足类标本
    mantle = blob(0.28, 0.7, 0.28, segs=18, name='mantle'); mantle.location = (0, 0.55, 0)
    mantle.data.materials.append(spec); meshes.append(mantle)
    head = blob(0.26, 0.22, 0.26, segs=14, name='shead'); head.location = (0, 0.95, 0)
    head.data.materials.append(spec); meshes.append(head)
    for k in range(8):
        a = k / 8 * 2 * math.pi
        t = tube((0, 0.45, 0), (0.3 * math.cos(a), 0.05, 0.3 * math.sin(a)), r=0.04, segs=6, name=f'ten{k}')
        t.data.materials.append(spec); meshes.append(t)
    # 棉线挂签
    tag = blob(0.12, 0.16, 0.02, segs=8, name='tag'); tag.location = (0.4, 0.5, 0)
    tag.data.materials.append(mat_pbr('Tag', base_color=(0.95, 0.95, 0.9, 1), roughness=0.9))
    meshes.append(tag)
    return meshes


# ---------------- 蝴蝶甲虫标本柜 ----------------
def build_insect():
    meshes = []
    wood = mat_pbr('Wood', base_color=(0.45, 0.30, 0.18, 1), roughness=0.7)
    tray = mat_pbr('Tray', base_color=(0.93, 0.92, 0.88, 1), roughness=0.9)
    glass = mat_pbr('GlassTop', transmission=0.9, roughness=0.05, ior=1.45,
                    base_color=(0.82, 0.88, 0.90, 1))

    box = rounded_box(2.4, 0.7, 1.8, r=0.04, name='box')
    box.data.materials.append(wood); meshes.append(box)
    # 内衬白盘
    inner = rounded_box(2.2, 0.5, 1.6, r=0.03, name='inner'); inner.location = (0, 0.05, 0)
    inner.data.materials.append(tray); meshes.append(inner)
    # 玻璃盖
    top = rounded_box(2.3, 0.06, 1.7, r=0.03, name='top'); top.location = (0, 0.5, 0)
    top.data.materials.append(glass); meshes.append(top)
    # 标本：上层蝴蝶 8，下层甲虫 10
    bf_colors = [(0.2, 0.4, 0.8), (0.8, 0.2, 0.2), (0.9, 0.7, 0.1), (0.2, 0.6, 0.3),
                 (0.6, 0.2, 0.7), (0.9, 0.9, 0.9), (1.0, 0.5, 0.1), (0.1, 0.5, 0.7)]
    for i in range(8):
        x = -0.9 + i * 0.26
        y = 0.42
        z = -0.35
        body_c = mat_pbr(f'bfb{i}', base_color=(0.15, 0.13, 0.12, 1), roughness=0.8)
        b = tube((x, y, z - 0.18), (x, y, z + 0.18), r=0.02, segs=6, name=f'bfb{i}')
        b.data.materials.append(body_c); meshes.append(b)
        for s in (-1, 1):
            wc = mat_pbr(f'bfw{i}{s}', base_color=bf_colors[i] + (1,), roughness=0.7)
            w = blob(0.12, 0.03, 0.16, segs=10, name=f'bfw{i}{s}')
            w.location = (x + s * 0.14, y, z)
            w.rotation_euler = (0, 0, s * 0.4)
            w.data.materials.append(wc); meshes.append(w)
    beetle_colors = [(0.2, 0.2, 0.25), (0.5, 0.1, 0.1), (0.1, 0.3, 0.15), (0.3, 0.2, 0.4),
                     (0.6, 0.4, 0.1), (0.1, 0.2, 0.3), (0.4, 0.4, 0.4), (0.7, 0.2, 0.3),
                     (0.2, 0.4, 0.4), (0.3, 0.3, 0.1)]
    for i in range(10):
        x = -1.0 + i * 0.22
        y = 0.4
        z = 0.4
        bc = mat_pbr(f'b{i}', base_color=beetle_colors[i] + (1,), roughness=0.6, metalness=0.1)
        body = blob(0.12, 0.06, 0.18, segs=12, name=f'b{i}')
        body.location = (x, y, z)
        body.data.materials.append(bc); meshes.append(body)
        h = blob(0.06, 0.05, 0.07, segs=8, name=f'bh{i}'); h.location = (x, y, z + 0.2)
        h.data.materials.append(bc); meshes.append(h)
    # 黄铜拉手
    handle = tube((-1.0, 0.0, 0.9), (1.0, 0.0, 0.9), r=0.03, segs=8, name='handle')
    handle.data.materials.append(mat_pbr('Brass', metalness=0.8, roughness=0.35, base_color=(0.7, 0.55, 0.2, 1)))
    meshes.append(handle)
    return meshes


BUILDERS = {
    'specimen-jar': (build_jar, 'specimen-jar.glb'),
    'insect-case': (build_insect, 'insect-case.glb'),
}

for key, (fn, fname) in BUILDERS.items():
    purge()
    objs = fn()
    for o in objs:
        mn = min(v.co.y for v in o.data.vertices)
        for v in o.data.vertices:
            v.co.y -= mn
        fix_normals(o)
    # 浸制标本罐需要竖直站立；昆虫标本柜应平放展示，保持 Y 轴厚度
    if key == 'specimen-jar':
        stand_up_rotate_x(objs)
    export_glb(os.path.join(MODELS, fname))
    print('exported', fname)
