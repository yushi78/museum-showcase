#!/usr/bin/env python3
# 自然馆化石：三叶虫、鱼化石（带围岩石板）
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from lib import (purge, mat_pbr, rounded_box, tube, fix_normals, export_glb)

MODELS = r"D:\workButty小程序\museum-showcase\site\models"


def blob(rx, ry, rz, segs=24, name='blob'):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=segs, ring_count=max(12, segs // 2))
    o = bpy.context.object; o.name = name
    o.scale = (rx, ry, rz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return o


def build_trilobite():
    matrix = mat_pbr('Matrix', base_img='rock_matrix.png', rough_img='rock_matrix_rough.png',
                     normal_img='rock_matrix_normal.png', roughness=0.9, normal_strength=0.8,
                     base_color=(1, 1, 1, 1))
    shell = mat_pbr('Trilobite', base_color=(0.34, 0.22, 0.15, 1), roughness=0.7, metalness=0.0)
    meshes = []
    slab = rounded_box(2.6, 0.22, 1.9, r=0.05, name='slab')
    slab.data.materials.append(matrix); meshes.append(slab)
    # 头甲（前部，半圆形扁平）
    cephalon = blob(0.55, 0.16, 0.72, segs=24, name='cephalon'); cephalon.location = (0.72, 0.24, 0)
    cephalon.data.materials.append(shell); meshes.append(cephalon)
    # 头鞍（头甲中央隆起）
    glabella = blob(0.3, 0.16, 0.28, segs=18, name='glabella'); glabella.location = (0.78, 0.34, 0)
    glabella.data.materials.append(shell); meshes.append(glabella)
    # 颊刺（头甲后侧角伸出的刺）
    for s in (-1, 1):
        spine = tube((0.55, 0.26, s * 0.36), (0.15, 0.24, s * 0.5), r=0.04, segs=8, name='genal_spine')
        spine.data.materials.append(shell); meshes.append(spine)
    # 胸节（中央轴叶隆起 + 两侧肋叶，体现三叶结构）
    for i in range(11):
        x = 0.4 - i * 0.06
        axis = blob(0.05, 0.1, 0.16, segs=10, name=f'axis{i}'); axis.location = (x, 0.3, 0)
        axis.data.materials.append(shell); meshes.append(axis)
        for s in (-1, 1):
            pleura = blob(0.04, 0.06, 0.3, segs=10, name=f'pleura{i}{s}'); pleura.location = (x, 0.26, s * 0.3)
            pleura.data.materials.append(shell); meshes.append(pleura)
    # 尾甲（扇形，小于头甲）+ 尾甲轴叶
    pygidium = blob(0.35, 0.12, 0.5, segs=20, name='pygidium'); pygidium.location = (-0.5, 0.22, 0)
    pygidium.data.materials.append(shell); meshes.append(pygidium)
    paxis = blob(0.2, 0.1, 0.14, segs=12, name='paxis'); paxis.location = (-0.5, 0.3, 0)
    paxis.data.materials.append(shell); meshes.append(paxis)
    # 眼叶（新月形，头甲两侧）
    for s in (-1, 1):
        eye = blob(0.12, 0.06, 0.2, segs=12, name=f'eye{s}'); eye.location = (0.62, 0.32, s * 0.26)
        eye.rotation_euler = (0, 0, s * 0.3)
        eye.data.materials.append(shell); meshes.append(eye)
    return meshes


def build_fish():
    matrix = mat_pbr('Matrix', base_img='rock_matrix.png', rough_img='rock_matrix_rough.png',
                     normal_img='rock_matrix_normal.png', roughness=0.9, normal_strength=0.8,
                     base_color=(1, 1, 1, 1))
    bone = mat_pbr('FishBone', base_color=(0.30, 0.20, 0.13, 1), roughness=0.7)
    meshes = []
    slab = rounded_box(2.8, 0.2, 1.8, r=0.05, name='slab')
    slab.data.materials.append(matrix); meshes.append(slab)
    # 鱼身（流线型，拉长的椭球）
    body = blob(1.3, 0.28, 0.4, segs=28, name='body'); body.location = (0, 0.22, 0)
    body.data.materials.append(bone); meshes.append(body)
    # 头骨（前部，清晰轮廓）
    head = blob(0.38, 0.26, 0.36, segs=18, name='head'); head.location = (1.1, 0.22, 0)
    head.data.materials.append(bone); meshes.append(head)
    # 眼窝（头骨上的黑点）
    eye = blob(0.06, 0.05, 0.05, segs=8, name='eye'); eye.location = (1.2, 0.28, 0.12)
    eye.data.materials.append(bone); meshes.append(eye)
    # 脊柱（一串椎骨，从头后到尾前）
    for i in range(18):
        x = 0.9 - i * 0.1
        vert = blob(0.05, 0.06, 0.08, segs=8, name=f'vert{i}'); vert.location = (x, 0.3, 0)
        vert.data.materials.append(bone); meshes.append(vert)
    # 肋骨（从脊柱向腹部延伸的细骨）
    for i in range(14):
        x = 0.8 - i * 0.09
        for s in (-1, 1):
            rib = tube((x, 0.28, s * 0.05), (x - 0.06, 0.12, s * 0.22), r=0.02, segs=6, name=f'rib{i}{s}')
            rib.data.materials.append(bone); meshes.append(rib)
    # 尾鳍（分叉——上下两叶）
    for s in (-1, 1):
        tailf = blob(0.4, 0.3, 0.06, segs=10, name=f'tailf{s}'); tailf.location = (-1.5, 0.22 + s * 0.12, 0)
        tailf.rotation_euler = (0, 0, s * 0.4)
        tailf.data.materials.append(bone); meshes.append(tailf)
    # 背鳍 / 臀鳍
    df = blob(0.5, 0.2, 0.05, segs=10, name='df'); df.location = (-0.1, 0.5, 0)
    df.data.materials.append(bone); meshes.append(df)
    af = blob(0.4, 0.15, 0.05, segs=10, name='af'); af.location = (-0.4, 0.02, 0)
    af.data.materials.append(bone); meshes.append(af)
    # 胸鳍（两侧）
    for s in (-1, 1):
        pf = blob(0.2, 0.1, 0.04, segs=8, name=f'pf{s}'); pf.location = (0.75, 0.18, s * 0.3)
        pf.rotation_euler = (0, 0, -0.3)
        pf.data.materials.append(bone); meshes.append(pf)
    return meshes


BUILDERS = {
    'trilobite-fossil': (build_trilobite, 'trilobite-fossil.glb'),
    'fish-fossil': (build_fish, 'fish-fossil.glb'),
}

for key, (fn, fname) in BUILDERS.items():
    purge()
    objs = fn()
    for o in objs:
        mn = min(v.co.y for v in o.data.vertices)
        for v in o.data.vertices:
            v.co.y -= mn
        fix_normals(o)
    export_glb(os.path.join(MODELS, fname))
    print('exported', fname)
