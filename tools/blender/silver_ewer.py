#!/usr/bin/env python3
# 唐代银执壶（鹦鹉纹银壶风格）Blender 手工建模 -> GLB
import bpy, math, os
from mathutils import Vector

ROOT = r"D:\workButty小程序\museum-showcase"
TEX = os.path.join(ROOT, "tools", "blender", "out", "tex")
OUT = os.path.join(ROOT, "site", "models", "tang-silver-ewer.glb")


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    for i in list(bpy.data.images):
        bpy.data.images.remove(i)


def silver_mat():
    mat = bpy.data.materials.new('Silver')
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Metallic'].default_value = 1.0
    bsdf.inputs['Roughness'].default_value = 0.35
    img = bpy.data.images.load(os.path.join(TEX, 'silver_base.png'))
    img.colorspace_settings.name = 'sRGB'
    tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = img; tn.location = (-400, 300)
    nt.links.new(tn.outputs['Color'], bsdf.inputs['Base Color'])
    rimg = bpy.data.images.load(os.path.join(TEX, 'silver_rough.png'))
    rimg.colorspace_settings.name = 'Non-Color'
    rn = nt.nodes.new('ShaderNodeTexImage'); rn.image = rimg; rn.location = (-400, 0)
    nt.links.new(rn.outputs['Color'], bsdf.inputs['Roughness'])
    nimg = bpy.data.images.load(os.path.join(TEX, 'silver_base_normal.png'))
    nimg.colorspace_settings.name = 'Non-Color'
    nn = nt.nodes.new('ShaderNodeTexImage'); nn.image = nimg; nn.location = (-400, -300)
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.location = (-150, -200)
    nm.inputs['Strength'].default_value = 0.7
    nt.links.new(nn.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


def lathe(profile_pts, seg=48, mat=None):
    """profile_pts: list of (x,y) 从底到顶，绕 Y 轴旋成实体"""
    bpy.ops.curve.primitive_bezier_circle_add(radius=1)
    cu = bpy.context.object
    cu.data.splines.clear()
    sp = cu.data.splines.new('POLY')
    sp.points.add(len(profile_pts) - 1)
    for i, (x, y) in enumerate(profile_pts):
        sp.points[i].co = (x, 0, y, 1)
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.object
    bpy.ops.object.modifier_add(type='SCREW')
    m = obj.modifiers[-1]
    m.axis = 'Z'; m.angle = math.tau; m.steps = seg; m.render_steps = seg
    bpy.ops.object.modifier_apply(modifier=m.name)
    if mat:
        obj.data.materials.append(mat)
    return obj


def main():
    purge()
    mat = silver_mat()
    # 梨形腹 + 长颈 + 侈口 轮廓（x=半径, y=高度）
    prof = [
        (0.001, 0.0), (0.085, 0.02), (0.13, 0.10), (0.135, 0.18),
        (0.11, 0.30), (0.07, 0.42), (0.045, 0.55), (0.05, 0.62),
        (0.075, 0.66), (0.075, 0.69), (0.04, 0.71),
    ]
    body = lathe(prof, 56, mat)
    body.location = (0, 0, 0)
    body.data.materials.append(mat)

    # 錾刻缠枝纹带（腹中部两道环）
    for zt in (0.12, 0.24):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.125, minor_radius=0.012,
                                         major_segments=48, minor_segments=8)
        belt = bpy.context.object
        belt.rotation_euler = (math.pi / 2, 0, 0)
        bpy.ops.object.transform_apply(rotation=True)
        belt.location = (0, 0, zt)
        belt.data.materials.append(mat)
    # 鹦鹉纹圆牌（腹前浮雕盘）
    bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=0.07, depth=0.01)
    med = bpy.context.object
    med.location = (0, 0.13, 0.20)
    med.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    med.scale = (1, 1, 0.4)
    med.data.materials.append(mat)
    # 鹦鹉（简：身体弯钩 + 尾）
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.03, segments=14, ring_count=10)
    bird = bpy.context.object
    bird.location = (0, 0.13, 0.22)
    bird.scale = (0.6, 1.4, 0.4)
    bird.data.materials.append(mat)

    # 龙柄（腹到颈的 S 形管）
    bpy.ops.curve.primitive_bezier_curve_add()
    cu = bpy.context.object
    cu.data.splines.clear()
    sp = cu.data.splines.new('BEZIER')
    pts = [(-0.12, 0, 0.10), (-0.20, 0, 0.30), (-0.13, 0, 0.55), (-0.07, 0, 0.62)]
    sp.bezier_points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.bezier_points[i].co = (p[0], p[1], p[2])
        sp.bezier_points[i].radius = 0.022
    cu.data.bevel_depth = 0.022
    cu.data.bevel_resolution = 6
    bpy.ops.object.convert(target='MESH')
    handle = bpy.context.object
    handle.data.materials.append(mat)

    # 凤流（颈部短弯流）
    bpy.ops.curve.primitive_bezier_curve_add()
    cu2 = bpy.context.object
    cu2.data.splines.clear()
    sp2 = cu2.data.splines.new('BEZIER')
    pts2 = [(0.12, 0, 0.55), (0.20, 0, 0.62), (0.24, 0, 0.70)]
    sp2.bezier_points.add(len(pts2) - 1)
    for i, p in enumerate(pts2):
        sp2.bezier_points[i].co = (p[0], p[1], p[2])
        sp2.bezier_points[i].radius = 0.018
    cu2.data.bevel_depth = 0.018
    cu2.data.bevel_resolution = 6
    bpy.ops.object.convert(target='MESH')
    spout = bpy.context.object
    spout.data.materials.append(mat)

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

    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format='GLB', use_selection=True,
        export_apply=True, export_materials='EXPORT',
        export_image_format='AUTO')
    print('EXPORTED', OUT)


main()
