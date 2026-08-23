#!/usr/bin/env python3
# 玉琮（良渚玉琮王风格）Blender 手工建模 -> GLB
import bpy, math, os, sys
from mathutils import Vector
try:
    HERE = os.path.dirname(os.path.abspath(__file__))
except NameError:
    HERE = r"D:\workButty小程序\museum-showcase\tools\blender"
sys.path.insert(0, HERE)
from lib import stand_up_auto

ROOT = r"D:\workButty小程序\museum-showcase"
TEX = os.path.join(ROOT, "tools", "blender", "out", "tex")
OUT = os.path.join(ROOT, "site", "models", "jade-cong.glb")


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    for i in list(bpy.data.images):
        bpy.data.images.remove(i)


def jade_mat():
    mat = bpy.data.materials.new('Jade')
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 0.35
    img = bpy.data.images.load(os.path.join(TEX, 'jade_base.png'))
    img.colorspace_settings.name = 'sRGB'
    tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = img; tn.location = (-400, 300)
    nt.links.new(tn.outputs['Color'], bsdf.inputs['Base Color'])
    rimg = bpy.data.images.load(os.path.join(TEX, 'jade_rough.png'))
    rimg.colorspace_settings.name = 'Non-Color'
    rn = nt.nodes.new('ShaderNodeTexImage'); rn.image = rimg; rn.location = (-400, 0)
    nt.links.new(rn.outputs['Color'], bsdf.inputs['Roughness'])
    nimg = bpy.data.images.load(os.path.join(TEX, 'jade_normal.png'))
    nimg.colorspace_settings.name = 'Non-Color'
    nn = nt.nodes.new('ShaderNodeTexImage'); nn.image = nimg; nn.location = (-400, -300)
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.location = (-150, -200)
    nm.inputs['Strength'].default_value = 0.7
    nt.links.new(nn.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


def rounded_box(w, h, d, r=0.015, seg=2):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object
    o.scale = (w / 2, h / 2, d / 2)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.modifier_add(type='BEVEL')
    m = o.modifiers[-1]; m.segments = seg; m.width = r; m.affect = 'EDGES'
    bpy.ops.object.modifier_apply(modifier=m.name)
    return o


def main():
    purge()
    mat = jade_mat()

    # 外方柱（去四棱→圆角方）
    outer = rounded_box(0.18, 0.5, 0.18, 0.03, 3)  # 边长 18cm，高 50cm
    # 内圆孔
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.045, depth=0.6)
    hole = bpy.context.object
    bpy.context.view_layer.objects.active = outer
    bpy.ops.object.modifier_add(type='BOOLEAN')
    mod = outer.modifiers[-1]; mod.operation = 'DIFFERENCE'; mod.object = hole
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(hole, do_unlink=True)
    outer.data.materials.append(mat)

    # 上下端射口微凹（减一内圆台）
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.052, depth=0.06)
    rim = bpy.context.object
    rim.location = (0, 0, 0.25)
    bpy.context.view_layer.objects.active = outer
    bpy.ops.object.modifier_add(type='BOOLEAN')
    mod = outer.modifiers[-1]; mod.operation = 'DIFFERENCE'; mod.object = rim
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(rim, do_unlink=True)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = outer
    # 底部加凹
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.052, depth=0.06)
    rb = bpy.context.object
    rb.location = (0, 0, -0.25)
    bpy.context.view_layer.objects.active = outer
    bpy.ops.object.modifier_add(type='BOOLEAN')
    mod = outer.modifiers[-1]; mod.operation = 'DIFFERENCE'; mod.object = rb
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(rb, do_unlink=True)

    # 四角竖向槽线（良渚特征）
    for sx in (-1, 1):
        for sy in (-1, 1):
            bpy.ops.mesh.primitive_cube_add(size=1)
            g = bpy.context.object
            g.scale = (0.012, 0.012, 0.25)
            g.location = (sx * 0.085, sy * 0.085, 0)
            g.data.materials.append(mat)

    # 神人兽面纹带（简化为上下两道浅浮雕环 + 四角小眼）
    for zt in (0.10, -0.10):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.092, minor_radius=0.01,
                                         major_segments=40, minor_segments=8)
        band = bpy.context.object
        band.rotation_euler = (math.pi / 2, 0, 0)
        bpy.ops.object.transform_apply(rotation=True)
        band.location = (0, 0, zt)
        band.data.materials.append(mat)
    # 四角小圆眼（神人眼）
    for sx in (-1, 1):
        for sy in (-1, 1):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.014, segments=14, ring_count=10)
            eye = bpy.context.object
            eye.location = (sx * 0.10, sy * 0.10, 0.0)
            eye.data.materials.append(mat)

    # 合并 + UV + 导出
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join()
    merged = bpy.context.object
    minz = min(v.co.z for v in merged.data.vertices)
    for o in bpy.data.objects:
        if o.type == 'MESH':
            o.location.z -= minz
    merged.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=0.02)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    stand_up_auto([merged])

    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format='GLB', use_selection=True,
        export_apply=True, export_materials='EXPORT',
        export_image_format='AUTO')
    print('EXPORTED', OUT)


main()
