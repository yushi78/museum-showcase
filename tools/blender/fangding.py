#!/usr/bin/env python3
# 青铜方鼎（后母戊鼎风格）Blender 手工建模 -> GLB
# 运行：blender --background --python fangding.py
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
OUT = os.path.join(ROOT, "site", "models", "bronze-fangding.glb")


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    for i in list(bpy.data.images):
        bpy.data.images.remove(i)


def bronze_mat():
    mat = bpy.data.materials.new('Bronze')
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (0.18, 0.27, 0.16, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.55
    bsdf.inputs['Roughness'].default_value = 0.58
    return mat


def rounded_box(w, h, d, r=0.02, seg=3):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object
    o.scale = (w / 2, h / 2, d / 2)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.modifier_add(type='BEVEL')
    m = o.modifiers[-1]; m.segments = seg; m.width = r; m.affect = 'EDGES'
    bpy.ops.object.modifier_apply(modifier=m.name)
    return o


def sel_verts(obj, pred):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='OBJECT')
    for v in obj.data.vertices:
        v.select = pred(v.co)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.object.mode_set(mode='OBJECT')


def main():
    purge()
    mat = bronze_mat()

    # ---- 有实际壁厚的开口方鼎 ----
    body = rounded_box(1.0,.70,.085,.018,3); body.location=(0,0,.045); body.data.materials.append(mat)
    for y in (-.315,.315):
        wall=rounded_box(1.0,.075,.53,.018,3); wall.location=(0,y,.31); wall.data.materials.append(mat)
    for x in (-.465,.465):
        wall=rounded_box(.075,.56,.53,.018,3); wall.location=(x,0,.31); wall.data.materials.append(mat)
    for y in (-.365,.365):
        rim=rounded_box(1.10,.075,.085,.02,3); rim.location=(0,y,.585); rim.data.materials.append(mat)
    for x in (-.515,.515):
        rim=rounded_box(.075,.66,.085,.02,3); rim.location=(x,0,.585); rim.data.materials.append(mat)

    # ---- 四兽足（柱足外撇）----
    for sx in (-1, 1):
        for sy in (-1, 1):
            bpy.ops.mesh.primitive_cylinder_add(vertices=22, radius=0.058, depth=0.62)
            leg = bpy.context.object
            leg.location = (sx * 0.40, sy * 0.26, -0.31)
            sel_verts(leg, lambda c: c.z < -0.30)
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.transform.resize(value=(1.28, 1.28, 1))
            bpy.ops.object.mode_set(mode='OBJECT')
            # 足根加兽面鼓（小环）
            bpy.ops.mesh.primitive_torus_add(major_radius=0.05, minor_radius=0.018,
                                             major_segments=16, minor_segments=8)
            knob = bpy.context.object
            knob.location = (sx * 0.40, sy * 0.26, -0.02)
            knob.scale = (1, 1, 0.6)
            for o in (leg, knob):
                o.data.materials.append(mat)

    # ---- 两矩形立耳 ----
    for sx in (-1,1):
        for y in (-.115,.115):
            ear=rounded_box(.055,.055,.32,.018,3); ear.location=(sx*.31,y,.76); ear.data.materials.append(mat)
        top=rounded_box(.07,.285,.065,.02,3); top.location=(sx*.31,0,.91); top.data.materials.append(mat)

    # ---- 四扉棱（角棱竖脊）----
    for sx in (-1, 1):
        for sy in (-1, 1):
            bpy.ops.mesh.primitive_cube_add(size=1)
            fl = bpy.context.object
            fl.scale = (0.026, 0.026, 0.30)
            fl.location = (sx * 0.50, sy * 0.35, 0.26)
            fl.data.materials.append(mat)

    # ---- 四面饕餮纹（眼+鼻脊）----
    def taotie(axis, sign):
        # 轴 'x' 表示在 ±X 面（法线沿 X），'y' 在 ±Y 面
        px = sign * 0.50 if axis == 'x' else 0.0
        py = sign * 0.35 if axis == 'y' else 0.0
        pxc = 0.0 if axis == 'x' else sign * 0.50
        pyc = 0.0 if axis == 'y' else sign * 0.35
        for dx in (-0.16, 0.16):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, segments=18, ring_count=14)
            eye = bpy.context.object
            if axis == 'x':
                eye.location = (sign * 0.505, dx, 0.30)
            else:
                eye.location = (dx, sign * 0.355, 0.30)
            eye.scale = (0.5, 1, 1) if axis == 'x' else (1, 0.5, 1)
            eye.data.materials.append(mat)
        # 鼻脊
        bpy.ops.mesh.primitive_cube_add(size=1)
        nose = bpy.context.object
        if axis == 'x':
            nose.scale = (0.02, 0.10, 0.05); nose.location = (sign * 0.505, 0, 0.22)
        else:
            nose.scale = (0.10, 0.02, 0.05); nose.location = (0, sign * 0.355, 0.22)
        nose.data.materials.append(mat)

    taotie('x', 1); taotie('x', -1); taotie('y', 1); taotie('y', -1)

    # ---- Preserve object transforms and export ----
    # Joining after applying every object's location baked the transforms a
    # second time and scattered the legs, ears and reliefs.  GLB supports a
    # multi-object assembly, so retain the authored coordinates exactly.
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
    minz=min((o.matrix_world @ v.co).z for o in objects for v in o.data.vertices)
    for o in objects: o.location.z-=minz
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects: o.select_set(True)
    bpy.context.view_layer.objects.active=body

    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format='GLB', use_selection=True,
        export_apply=False, export_materials='EXPORT',
        export_image_format='AUTO')
    print('EXPORTED', OUT)


main()
