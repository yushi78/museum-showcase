#!/usr/bin/env python3
# 玉玺（盘龙钮玉玺风格）Blender 手工建模 -> GLB
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
OUT = os.path.join(ROOT, "site", "models", "jade-imperial-seal.glb")


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
    bsdf.inputs['Roughness'].default_value = 0.3
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


def rounded_box(w, h, d, r=0.012, seg=2):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object
    o.scale = (w / 2, h / 2, d / 2)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.modifier_add(type='BEVEL')
    m = o.modifiers[-1]; m.segments = seg; m.width = r; m.affect = 'EDGES'
    bpy.ops.object.modifier_apply(modifier=m.name)
    return o


def dragon_knob(mat):
    # 盘龙：身体用圆环 + 头部用球 + 爪用小锥
    bpy.ops.mesh.primitive_torus_add(major_radius=0.10, minor_radius=0.028,
                                     major_segments=40, minor_segments=12)
    body = bpy.context.object
    body.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    body.scale = (1, 1, 0.6)  # 压扁成盘
    body.data.materials.append(mat)
    # 龙头
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, segments=18, ring_count=14)
    head = bpy.context.object
    head.location = (0.10, 0.0, 0.05)
    head.scale = (1.2, 0.9, 0.9)
    head.data.materials.append(mat)
    # 龙角/鬃（几根小锥）
    for k in range(5):
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.012, radius2=0.0, depth=0.05)
        horn = bpy.context.object
        a = k / 5 * math.tau
        horn.location = (0.10 + math.cos(a) * 0.03, math.sin(a) * 0.03, 0.10)
        horn.rotation_euler = (0, 0, a)
        horn.data.materials.append(mat)
    # 四爪
    for k in range(4):
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.014, radius2=0.0, depth=0.04)
        claw = bpy.context.object
        a = k / 4 * math.tau + 0.4
        claw.location = (math.cos(a) * 0.10, math.sin(a) * 0.10, -0.01)
        claw.rotation_euler = (math.pi / 2, 0, 0)
        claw.data.materials.append(mat)


def main():
    purge()
    mat = jade_mat()

    # 印座（方柱）
    base = rounded_box(0.22, 0.16, 0.22, 0.01, 2)  # 边长 22cm，高 16cm
    base.location = (0, 0, 0.08)
    base.data.materials.append(mat)
    # 印台（略收的顶沿）
    bpy.ops.mesh.primitive_cylinder_add(vertices=4, radius=0.12, depth=0.03)
    plat = bpy.context.object
    plat.rotation_euler = (0, 0, math.pi / 4)  # 转正为方
    bpy.ops.object.transform_apply(rotation=True)
    plat.scale = (1, 1, 1)
    plat.location = (0, 0, 0.165)
    plat.data.materials.append(mat)

    # 盘龙钮
    dragon_knob(mat)
    # 整体抬高钮到印台之上
    bpy.ops.object.select_all(action='SELECT')
    for o in bpy.context.selected_objects:
        if o.name.startswith('Torus') or o.name.startswith('Sphere') or o.name.startswith('Cone'):
            o.location.z += 0.18

    # 印面阳文（底面浅浮字：用几个细长方块代表篆字笔画）
    bpy.ops.object.select_all(action='DESELECT')
    for dx in (-0.05, 0.0, 0.05):
        bpy.ops.mesh.primitive_cube_add(size=1)
        st = bpy.context.object
        st.scale = (0.015, 0.10, 0.01)
        st.location = (dx, 0, -0.005)
        st.data.materials.append(mat)

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
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    stand_up_auto([merged])

    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format='GLB', use_selection=True,
        export_apply=True, export_materials='EXPORT',
        export_image_format='AUTO')
    print('EXPORTED', OUT)


main()
