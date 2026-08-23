#!/usr/bin/env python3
# 自然馆现生/冰期哺乳动物：猛犸象、东北虎、大熊猫、川金丝猴
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from lib import (purge, mat_pbr, rounded_box, tube, bezier_tube, fix_normals, export_glb, stand_up_rotate_x)

MODELS = r"D:\workButty小程序\museum-showcase\site\models"


def blob(rx, ry, rz, segs=24, name='blob'):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=segs, ring_count=max(12, segs // 2))
    o = bpy.context.object
    o.name = name
    o.scale = (rx, ry, rz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return o


def loft(name, rings, sides, mat, subdiv=2):
    """用截面环放样 + Subdivision Surface 细分，生成平滑有机体（真正的 Blender 建模）。
    rings: [(x, y, z, ry, rz), ...] —— 截面中心坐标 + 上下半径 ry / 左右半径 rz
    subdiv: 细分曲面级数（1-3），越高越平滑，顶点也越多"""
    v = []
    for x, y, z, ry, rz in rings:
        for j in range(sides):
            a = 2 * math.pi * j / sides
            n = 1 + 0.03 * math.sin(a * 5 + x * 1.5) + 0.015 * math.sin(a * 11 - x * 2.3)
            v.append((x, y + math.cos(a) * ry * n, z + math.sin(a) * rz * n))
    f = []
    nr = len(rings)
    for i in range(nr - 1):
        for j in range(sides):
            k = (j + 1) % sides
            f.append((i * sides + j, i * sides + k, (i + 1) * sides + k, (i + 1) * sides + j))
    f += [tuple(range(sides - 1, -1, -1)), tuple((nr - 1) * sides + j for j in range(sides))]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    fix_normals(o)
    for p in o.data.polygons:
        p.use_smooth = True
    if subdiv > 0:
        bpy.context.view_layer.objects.active = o
        o.modifiers.new('Subdiv', 'SUBSURF')
        o.modifiers['Subdiv'].levels = subdiv
        o.modifiers['Subdiv'].render_levels = subdiv
        bpy.ops.object.modifier_apply(modifier='Subdiv')
        fix_normals(o)
    return o


def mat(name, base_img=None, base_color=(1, 1, 1, 1), metalness=0.0, roughness=0.85,
        rough_img=None, normal_img=None, normal_strength=0.8):
    return mat_pbr(name, base_img=base_img, rough_img=rough_img, normal_img=normal_img,
                   metalness=metalness, roughness=roughness, base_color=base_color,
                   normal_strength=normal_strength)


# ---------------- 猛犸象 ----------------
def build_mammoth():
    fur = mat('MammothFur', base_color=(0.25, 0.14, 0.075, 1), roughness=0.98)
    dark = mat('MammothDark', base_color=(0.075, 0.043, 0.027, 1), roughness=0.98)
    ivory = mat_pbr('aged mammoth ivory',metalness=0.0,roughness=0.68,base_color=(0.72,0.58,0.36,1))
    meshes = []
    # 身体 + 头（连续放样：尾→头，肩峰最高 + 臀峰 + 圆顶头骨，消除拼接感）
    body_rings = [
        (-2.2, 1.8, 0, 0.6, 0.45), (-1.6, 2.1, 0, 0.95, 0.75), (-1.0, 2.5, 0, 1.25, 0.95),
        (-0.3, 2.8, 0, 1.45, 1.1), (0.5, 3.1, 0, 1.55, 1.15), (1.3, 2.8, 0, 1.35, 1.0),
        (1.9, 2.5, 0, 1.0, 0.8), (2.3, 2.4, 0, 0.8, 0.65),
    ]
    body = loft('body', body_rings, 14, fur, 2); meshes.append(body)
    # 长毛由连续的体表轮廓和粗糙材质表现，避免用独立细棍模拟毛发。
    head_rings = [
        (2.3, 2.4, 0, 0.8, 0.65), (2.6, 2.7, 0, 0.85, 0.7), (2.9, 2.5, 0, 0.7, 0.6), (3.1, 2.3, 0, 0.5, 0.45),
    ]
    head = loft('head', head_rings, 12, fur, 2); meshes.append(head)
    # 弯曲象鼻（从鼻根向前下方自然下垂，末端微卷）
    trunk_pts = [(2.9, 2.4, 0), (3.4, 1.7, 0), (3.6, 0.8, 0), (3.4, 0.15, 0.05), (3.1, 0.12, 0.12)]
    trunk = bezier_tube(trunk_pts, r=0.26, segs=14, name='trunk')
    bpy.ops.object.select_all(action='DESELECT'); trunk.select_set(True)
    bpy.context.view_layer.objects.active = trunk
    bpy.ops.object.convert(target='MESH'); o = bpy.context.object; fix_normals(o)
    o.data.materials.append(fur); meshes.append(o)
    # 耳（极小，紧贴头侧）
    for s in (-1, 1):
        ear = blob(0.32, 0.4, 0.12, name='ear'); ear.location = (2.3, 2.6, s * 0.8)
        ear.data.materials.append(dark); meshes.append(ear)
    # 眼（小黑珠）
    for s in (-1, 1):
        eye = blob(0.07, 0.06, 0.05, name='eye'); eye.location = (2.8, 2.5, s * 0.32)
        eye.data.materials.append(dark); meshes.append(eye)
    # 四肢（大腿、小腿和脚垫用有机体块连接，避免方柱感）
    for px in (1.4, -1.4):
        for s in (-1, 1):
            upper = blob(0.48, 0.78, 0.44, name='muscular upper leg'); upper.location = (px, 1.72, s * 0.65)
            knee = blob(0.44, 0.38, 0.41, name='knee'); knee.location = (px + 0.08, 1.08, s * 0.65)
            lower = blob(0.36, 0.66, 0.33, name='tapered lower leg'); lower.location = (px + 0.16, 0.56, s * 0.65)
            foot = blob(0.50, 0.22, 0.40, name='round foot pad'); foot.location = (px + 0.28, 0.18, s * 0.65)
            for o in (upper, knee, lower, foot):
                o.data.materials.append(fur); meshes.append(o)
    # 真猛犸象的尾极短；侧后方轮廓直接收入臀部，不另造悬空零件。
    # 象牙（三维螺旋，向内卷曲——猛犸象特征）
    for s in (-1, 1):
        pts = [(2.6, 1.9, s * 0.4), (3.1, 1.1, s * 1.0), (3.3, 0.3, s * 1.55),
               (2.9, 0.1, s * 1.4), (2.5, 0.45, s * 0.85), (2.6, 0.95, s * 0.3)]
        t = bezier_tube(pts, r=0.15, segs=12, name='tusk')
        bpy.ops.object.select_all(action='DESELECT'); t.select_set(True)
        bpy.context.view_layer.objects.active = t
        bpy.ops.object.convert(target='MESH'); o = bpy.context.object; fix_normals(o)
        o.data.materials.append(ivory); meshes.append(o)
    return meshes


# ---------------- 东北虎 ----------------
def build_tiger():
    fur = mat('TigerFur', base_img='fur_orange.png', rough_img='fur_orange_rough.png',
              normal_img='fur_orange_normal.png', roughness=0.9, normal_strength=1.0)
    black = mat('TigerBlack', base_color=(0.12, 0.10, 0.09, 1), roughness=0.85)
    white = mat('TigerWhite', base_color=(0.95, 0.93, 0.88, 1), roughness=0.85)
    meshes = []
    # 身体+脖子+头（连续放样：流线型，虎头占比例大）
    body_rings = [
        (-2.3, 1.05, 0, 0.5, 0.42), (-1.7, 1.2, 0, 0.75, 0.55), (-1.0, 1.3, 0, 0.9, 0.65),
        (-0.2, 1.35, 0, 0.95, 0.7), (0.6, 1.3, 0, 0.85, 0.65), (1.3, 1.25, 0, 0.7, 0.55),
        (1.8, 1.3, 0, 0.6, 0.52), (2.2, 1.5, 0, 0.62, 0.58), (2.6, 1.5, 0, 0.55, 0.5),
        (2.9, 1.38, 0, 0.4, 0.4),
    ]
    body = loft('body', body_rings, 14, fur, 2); meshes.append(body)
    # 宽吻（白）+ 鼻头（黑）
    snout = blob(0.42, 0.34, 0.4, name='snout'); snout.location = (2.95, 1.32, 0)
    snout.data.materials.append(white); meshes.append(snout)
    nose = blob(0.1, 0.08, 0.09, name='nose'); nose.location = (3.15, 1.4, 0)
    nose.data.materials.append(black); meshes.append(nose)
    # 耳（圆，黑底白点）
    for s in (-1, 1):
        ear = blob(0.22, 0.22, 0.1, name='ear'); ear.location = (2.3, 2.05, s * 0.4)
        ear.data.materials.append(black); meshes.append(ear)
        ew = blob(0.09, 0.09, 0.05, name='earw'); ew.location = (2.32, 2.07, s * 0.4)
        ew.data.materials.append(white); meshes.append(ew)
    # 眼（黑珠）+ 眼上白斑
    for s in (-1, 1):
        eye = blob(0.07, 0.06, 0.05, name='eye'); eye.location = (2.65, 1.62, s * 0.26)
        eye.data.materials.append(black); meshes.append(eye)
        eb = blob(0.1, 0.09, 0.05, name='eb'); eb.location = (2.68, 1.7, s * 0.22)
        eb.data.materials.append(white); meshes.append(eb)
    # 四肢（前肢略短、后肢略长，带关节）
    for s in (-1, 1):
        f_u = tube((1.35, 1.0, s * 0.42), (1.45, 0.5, s * 0.42), r=0.26, segs=12, name='flu')
        f_k = blob(0.28, 0.26, 0.28, name='fk'); f_k.location = (1.45, 0.5, s * 0.42)
        f_l = tube((1.45, 0.5, s * 0.42), (1.5, 0.05, s * 0.42), r=0.2, segs=12, name='fll')
        for o in (f_u, f_k, f_l):
            o.data.materials.append(fur); meshes.append(o)
        h_u = tube((-1.35, 1.0, s * 0.42), (-1.45, 0.5, s * 0.42), r=0.28, segs=12, name='hlu')
        h_k = blob(0.3, 0.28, 0.3, name='hk'); h_k.location = (-1.45, 0.5, s * 0.42)
        h_l = tube((-1.45, 0.5, s * 0.42), (-1.5, 0.05, s * 0.42), r=0.22, segs=12, name='hll')
        for o in (h_u, h_k, h_l):
            o.data.materials.append(fur); meshes.append(o)
    # 长尾（虎尾约占身长一半，向后方 S 形垂下）
    tail_pts = [(-2.3, 1.1, 0), (-3.2, 1.05, 0.3), (-4.0, 0.85, -0.1), (-4.5, 0.7, 0.2)]
    tail = bezier_tube(tail_pts, r=0.15, segs=12, name='tail')
    bpy.ops.object.select_all(action='DESELECT'); tail.select_set(True)
    bpy.context.view_layer.objects.active = tail
    bpy.ops.object.convert(target='MESH'); o = bpy.context.object; fix_normals(o)
    o.data.materials.append(fur); meshes.append(o)
    tailtip = blob(0.16, 0.16, 0.16, name='tailtip'); tailtip.location = (-4.5, 0.7, 0.2)
    tailtip.data.materials.append(black); meshes.append(tailtip)
    return meshes


# ---------------- 大熊猫 ----------------
def build_panda():
    white = mat('PandaWhite', base_img='fur_white.png', rough_img='fur_white_rough.png',
                normal_img='fur_white_normal.png', roughness=0.85, normal_strength=1.0)
    black = mat('PandaBlack', base_color=(0.10, 0.10, 0.11, 1), roughness=0.8)
    meshes = []
    # 圆胖身体（连续放样：前后有区分，不呆板）
    body_rings = [
        (-1.3, 1.1, 0, 0.7, 0.62), (-0.6, 1.25, 0, 0.9, 0.78), (0.1, 1.3, 0, 0.95, 0.82),
        (0.7, 1.25, 0, 0.78, 0.68), (1.1, 1.35, 0, 0.62, 0.56),
    ]
    body = loft('body', body_rings, 24, white); meshes.append(body)
    # 黑色肩带（前肢肩部黑色区域，熊猫"黑背心"）
    shawl = blob(0.7, 0.55, 0.95, name='shawl'); shawl.location = (0.55, 1.45, 0)
    shawl.data.materials.append(black); meshes.append(shawl)
    # 大圆头
    head = blob(0.72, 0.68, 0.68, name='head'); head.location = (1.2, 1.6, 0)
    head.data.materials.append(white); meshes.append(head)
    # 吻部（短黑鼻）
    snout = blob(0.24, 0.2, 0.22, name='snout'); snout.location = (1.6, 1.45, 0)
    snout.data.materials.append(black); meshes.append(snout)
    # 耳（黑，圆）
    for s in (-1, 1):
        ear = blob(0.22, 0.22, 0.1, name='ear'); ear.location = (1.1, 2.1, s * 0.42)
        ear.data.materials.append(black); meshes.append(ear)
    # 黑眼圈（标志性，围绕眼睛的斜椭圆 + 眼珠）
    for s in (-1, 1):
        ep = blob(0.26, 0.2, 0.14, name='eyepatch'); ep.location = (1.35, 1.62, s * 0.28)
        ep.rotation_euler = (0.35, s * 0.3, 0.0)
        ep.data.materials.append(black); meshes.append(ep)
        eye = blob(0.05, 0.05, 0.04, name='eye'); eye.location = (1.4, 1.62, s * 0.28)
        eye.data.materials.append(black); meshes.append(eye)
    # 四肢（黑色，前肢连肩带，后肢略粗）
    for s in (-1, 1):
        f_u = tube((0.8, 1.1, s * 0.5), (0.9, 0.5, s * 0.5), r=0.28, segs=12, name='flu')
        f_l = tube((0.9, 0.5, s * 0.5), (0.95, 0.05, s * 0.5), r=0.24, segs=12, name='fll')
        h_u = tube((-0.85, 1.1, s * 0.5), (-0.95, 0.5, s * 0.5), r=0.3, segs=12, name='hlu')
        h_l = tube((-0.95, 0.5, s * 0.5), (-1.0, 0.05, s * 0.5), r=0.26, segs=12, name='hll')
        for o in (f_u, f_l, h_u, h_l):
            o.data.materials.append(black); meshes.append(o)
    return meshes


# ---------------- 川金丝猴（坐姿）----------------
def build_monkey():
    gold = mat('MonkeyGold', base_img='fur_golden.png', rough_img='fur_golden_rough.png',
               normal_img='fur_golden_normal.png', roughness=0.9, normal_strength=1.0)
    blue = mat('MonkeyFace', base_color=(0.55, 0.72, 0.82, 1), roughness=0.6)
    dark = mat('MonkeyDark', base_color=(0.22, 0.16, 0.10, 1), roughness=0.85)
    meshes = []
    # 躯干（坐姿连续放样：臀坐地→肩，略前倾）
    torso_rings = [
        (0, 0.4, 0, 0.45, 0.38), (0, 0.85, 0, 0.55, 0.46), (0.05, 1.3, 0, 0.55, 0.46),
        (0.15, 1.6, 0, 0.48, 0.42),
    ]
    torso = loft('torso', torso_rings, 20, gold); meshes.append(torso)
    # 肩部蓬松长毛（金丝猴标志性的金色披肩毛）
    for s in (-1, 1):
        shoulder = blob(0.4, 0.35, 0.3, name='shoulder'); shoulder.location = (0.1, 1.5, s * 0.35)
        shoulder.data.materials.append(gold); meshes.append(shoulder)
    # 头（天蓝脸，较大）
    face = blob(0.4, 0.42, 0.38, name='face'); face.location = (0.4, 1.9, 0)
    face.data.materials.append(blue); meshes.append(face)
    # 仰鼻（鼻孔朝上的小凸起——金丝猴"仰鼻猴"特征）
    nose = blob(0.08, 0.06, 0.06, name='nose'); nose.location = (0.62, 1.95, 0)
    nose.data.materials.append(dark); meshes.append(nose)
    # 金色冠毛（头顶）
    crown = blob(0.45, 0.35, 0.45, name='crown'); crown.location = (0.25, 2.15, 0)
    crown.data.materials.append(dark); meshes.append(crown)
    # 吻
    snout = blob(0.16, 0.14, 0.15, name='snout'); snout.location = (0.65, 1.82, 0)
    snout.data.materials.append(blue); meshes.append(snout)
    # 前臂（撑地，金色）
    for s in (-1, 1):
        arm = tube((0.3, 1.35, s * 0.3), (0.65, 0.15, s * 0.45), r=0.15, segs=10, name='arm')
        arm.data.materials.append(gold); meshes.append(arm)
    # 腿（盘坐，金色）
    for s in (-1, 1):
        leg = tube((-0.2, 0.7, s * 0.4), (0.35, 0.2, s * 0.55), r=0.17, segs=10, name='leg')
        leg.data.materials.append(gold); meshes.append(leg)
    # 长尾（金色，蓬松尾尖）
    tail_pts = [(-0.3, 0.8, 0), (-1.0, 0.7, 0.3), (-1.6, 0.9, -0.1), (-1.9, 1.2, 0.1)]
    tail = bezier_tube(tail_pts, r=0.13, segs=12, name='tail')
    bpy.ops.object.select_all(action='DESELECT'); tail.select_set(True)
    bpy.context.view_layer.objects.active = tail
    bpy.ops.object.convert(target='MESH'); o = bpy.context.object; fix_normals(o)
    o.data.materials.append(gold); meshes.append(o)
    tailtip = blob(0.2, 0.2, 0.2, name='tailtip'); tailtip.location = (-1.9, 1.2, 0.1)
    tailtip.data.materials.append(gold); meshes.append(tailtip)
    return meshes


BUILDERS = {
    'mammoth': (build_mammoth, 'mammoth.glb'),
    'siberian-tiger': (build_tiger, 'siberian-tiger.glb'),
    'giant-panda': (build_panda, 'giant-panda.glb'),
    'golden-monkey': (build_monkey, 'golden-monkey.glb'),
}

requested=None
if '--' in sys.argv:
    tailargs=sys.argv[sys.argv.index('--')+1:]
    requested=tailargs[0] if tailargs else None
for key, (fn, fname) in BUILDERS.items():
    if requested and key != requested: continue
    purge()
    objs = fn()
    # 整具标本统一贴地；不可把每个零件分别归零，否则头、耳、关节会散架。
    global_min=min((o.matrix_world @ v.co).y for o in objs for v in o.data.vertices)
    for o in objs:
        o.location.y -= global_min
        fix_normals(o)
    stand_up_rotate_x(objs)
    export_glb(os.path.join(MODELS, fname))
    print('exported', fname)
