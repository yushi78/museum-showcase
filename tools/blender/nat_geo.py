#!/usr/bin/env python3
# 自然馆地质标本：硅化木、柱状玄武岩、铁陨石切片
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from lib import (purge, mat_pbr, rounded_box, tube, fix_normals, export_glb, stand_up_rotate_x)

MODELS = r"D:\workButty小程序\museum-showcase\site\models"


def disc(r, name='disc'):
    bpy.ops.mesh.primitive_circle_add(radius=r, vertices=48, fill_type='NGON')
    o = bpy.context.object; o.name = name
    return o


# ---------------- 硅化木 ----------------
def build_petrified():
    bark = mat_pbr('PetBark', base_color=(0.42, 0.32, 0.26, 1), roughness=0.95)
    agate = mat_pbr('PetAgate', base_img='petrified.png', rough_img='petrified_rough.png',
                    normal_img='petrified_normal.png', metalness=0.0, roughness=0.3,
                    normal_strength=0.8, base_color=(1, 1, 1, 1))
    meshes = []
    # 原木：沿 X 轴的圆柱
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=3.0, vertices=28)
    log = bpy.context.object; log.name = 'log'
    log.rotation_euler = (0, math.pi / 2, 0)
    log.data.materials.append(bark); meshes.append(log)
    # 两端抛光切面（玛瑙年轮）
    for ex in (-1.5, 1.5):
        d = disc(0.55, name='cut')
        d.rotation_euler = (0, math.pi / 2, 0)
        d.location = (ex, 0, 0)
        # 确保圆盘有 UV 以映射年轮
        bpy.context.view_layer.objects.active = d
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(island_margin=0.02)
        bpy.ops.object.mode_set(mode='OBJECT')
        d.data.materials.append(agate); meshes.append(d)
    return meshes


# ---------------- 柱状玄武岩 ----------------
def build_basalt():
    rock = mat_pbr('Basalt', base_img='basalt_base.png', rough_img='basalt_base_rough.png',
                   normal_img='basalt_base_normal.png', roughness=0.9, normal_strength=0.9,
                   base_color=(1, 1, 1, 1))
    meshes = []
    # 一组六棱柱（不同高度 + 一两截断裂）
    layout = [(-0.5, 0, 2.2), (0.5, 0, 2.0), (-0.5, 0.9, 1.7), (0.5, 0.9, 1.5),
              (0.0, 1.8, 2.4), (-0.9, 0.9, 1.2), (0.9, 1.8, 1.3)]
    for i, (x, z, h) in enumerate(layout):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.42, depth=h, vertices=6)
        c = bpy.context.object; c.name = f'col{i}'
        c.location = (x, h / 2, z)
        # 略错位分节
        c.rotation_euler = (0, 0, (i % 3 - 1) * 0.04)
        c.data.materials.append(rock); meshes.append(c)
        # 顶端球窝分节（小凹）
    return meshes


# ---------------- 铁陨石切片 ----------------
def build_meteorite():
    met = mat_pbr('Meteorite', base_img='meteorite_wid.png', rough_img='meteorite_wid_rough.png',
                  normal_img='meteorite_wid_normal.png', metalness=0.9, roughness=0.3,
                  normal_strength=0.7, base_color=(1, 1, 1, 1))
    crust = mat_pbr('FusionCrust', base_color=(0.08, 0.08, 0.09, 1), roughness=0.85, metalness=0.1)
    meshes = []
    # 切片：扁圆盘
    bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=0.18, vertices=40)
    slab = bpy.context.object; slab.name = 'slice'
    slab.data.materials.append(met); meshes.append(slab)
    # 熔壳边缘（暗环）
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.05, major_segments=40, minor_segments=8)
    ring = bpy.context.object; ring.name = 'crust'
    ring.rotation_euler = (math.pi / 2, 0, 0)
    ring.location = (0, 0, 0)
    ring.data.materials.append(crust); meshes.append(ring)
    return meshes


BUILDERS = {
    'petrified-wood': (build_petrified, 'petrified-wood.glb'),
    'basalt-columns': (build_basalt, 'basalt-columns.glb'),
    'meteorite': (build_meteorite, 'meteorite.glb'),
}

for key, (fn, fname) in BUILDERS.items():
    purge()
    objs = fn()
    for o in objs:
        mn = min(v.co.y for v in o.data.vertices)
        for v in o.data.vertices:
            v.co.y -= mn
        fix_normals(o)
    stand_up_rotate_x(objs)
    export_glb(os.path.join(MODELS, fname))
    print('exported', fname)
