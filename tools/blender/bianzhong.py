#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
曾侯乙编钟（战国早期 · 公元前 433 年）Blender 手工建模 -> GLB

文物形制要点：
  · 曲尺（L）形木胎髹漆钟架：长边 7.48 m、短边 3.35 m、通高 2.73 m
  · 三层八组共 65 件：上层钮钟 19、中层甬钟 33、下层甬钟 12 + 楚王镈 1
  · 钟体为「合瓦形」截面：鼓面宽、铣侧窄，于口两铣下垂、中部上凹
  · 每钟篆间铸 36 枚乳钉状「枚」
  · 6 尊佩剑青铜武士双臂上举承托横梁

导出：两个 mesh —— Bronze（钟+铜人）、Lacquer（木架），材质正确分离。
"""
import bpy, math, os

ROOT = r"D:\workButty小程序\museum-showcase"
TEX = os.path.join(ROOT, "tools", "blender", "out", "tex")
OUT = os.path.join(ROOT, "site", "models", "bianzhong.glb")

L_LONG = 7.48
L_SHORT = 3.35
Z_LOW, Z_MID, Z_TOP = 1.62, 2.20, 2.64
BEAM_H = 0.10
X0, X1 = -L_LONG / 2, L_LONG / 2
ZD = -1.34
ZD1 = ZD + L_SHORT

BRONZE_OBJS = []
LAC_OBJS = []


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
    b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    # Keep the material inside glTF's native metallic/roughness model. Blender
    # procedural nodes are not portable and previously exported as grey-black.
    b.inputs['Base Color'].default_value = (0.48, 0.19, 0.035, 1.0)
    b.inputs['Metallic'].default_value = 0.58
    b.inputs['Roughness'].default_value = 0.48
    return mat


def lac_mat():
    mat = bpy.data.materials.new('Lacquer')
    mat.use_nodes = True
    mat.use_backface_culling = False
    b = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (0.22, 0.018, 0.012, 1.0)
    b.inputs['Metallic'].default_value = .18
    b.inputs['Roughness'].default_value = 0.32
    return mat


def beam(x0, y0, x1, y1, z, w=0.10, h=BEAM_H):
    dx, dy = x1 - x0, y1 - y0
    ln = math.hypot(dx, dy)
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, z))
    o = bpy.context.object
    o.scale = (ln / 2, w / 2, h / 2)
    o.rotation_euler[2] = math.atan2(dy, dx)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    o.data.materials.append(LAC)
    LAC_OBJS.append(o)
    return o


def post(x, y, z0, z1, r=0.055):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=z1 - z0, vertices=12,
                                        location=(x, y, (z0 + z1) / 2))
    o = bpy.context.object
    o.data.materials.append(LAC)
    LAC_OBJS.append(o)


def collar(x, y, z, r=0.085, h=0.06):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=14, location=(x, y, z))
    o = bpy.context.object
    o.data.materials.append(BR)
    BRONZE_OBJS.append(o)


def bronze_man(x, y, top_z, scale=1.0):
    s = scale
    h_leg = 0.44 * s
    h_body = 0.50 * s
    base_z = top_z - (0.08 + h_leg + h_body + 0.28) * s
    # 柱础
    bpy.ops.mesh.primitive_cylinder_add(radius=0.17 * s, depth=0.08 * s, vertices=16,
                                        location=(x, y, base_z + 0.04 * s))
    o = bpy.context.object; o.data.materials.append(LAC); LAC_OBJS.append(o)
    # 双腿
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.060 * s, depth=h_leg, vertices=10,
                                            location=(x + sx * 0.072 * s, y, base_z + 0.08 * s + h_leg / 2))
        o = bpy.context.object; o.data.materials.append(BR); BRONZE_OBJS.append(o)
    # 躯干（宽肩）
    bpy.ops.mesh.primitive_cone_add(radius1=0.145 * s, radius2=0.108 * s, depth=h_body, vertices=14,
                                    location=(x, y, base_z + 0.08 * s + h_leg + h_body / 2))
    o = bpy.context.object; o.data.materials.append(BR); BRONZE_OBJS.append(o)
    # 头
    hz = base_z + 0.08 * s + h_leg + h_body + 0.095 * s
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.090 * s, segments=14, ring_count=10, location=(x, y, hz))
    o = bpy.context.object; o.scale = (0.86, 0.90, 1.0)
    bpy.ops.object.transform_apply(scale=True); o.data.materials.append(BR); BRONZE_OBJS.append(o)
    # 双臂上举
    shoulder_z = base_z + 0.08 * s + h_leg + h_body * 0.90
    hand_z = top_z - 0.045 * s
    for sx in (-1, 1):
        hx = x + sx * 0.185 * s
        # 上臂（倾斜向上）
        bpy.ops.mesh.primitive_cylinder_add(radius=0.052 * s, depth=0.30 * s, vertices=10,
                                            location=(x + sx * 0.14 * s, y, shoulder_z + 0.12 * s))
        o = bpy.context.object
        o.rotation_euler[1] = sx * 0.55
        bpy.ops.object.transform_apply(rotation=True); o.data.materials.append(BR); BRONZE_OBJS.append(o)
        # 下臂
        bpy.ops.mesh.primitive_cylinder_add(radius=0.044 * s, depth=0.28 * s, vertices=10,
                                            location=(hx, y, shoulder_z + 0.30 * s))
        o = bpy.context.object
        o.rotation_euler[1] = -sx * 0.10
        bpy.ops.object.transform_apply(rotation=True); o.data.materials.append(BR); BRONZE_OBJS.append(o)
        # 手掌托
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x + sx * 0.10 * s, y, hand_z))
        o = bpy.context.object; o.scale = (0.08 * s, 0.12 * s, 0.04 * s)
        bpy.ops.object.transform_apply(scale=True); o.data.materials.append(BR); BRONZE_OBJS.append(o)
    # 腰佩剑
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x - 0.14 * s, y - 0.05 * s,
                                                      base_z + 0.08 * s + h_leg + 0.12 * s))
    o = bpy.context.object
    o.scale = (0.018 * s, 0.028 * s, 0.18 * s)
    o.rotation_euler[1] = 0.18
    bpy.ops.object.transform_apply(scale=True, rotation=True); o.data.materials.append(BR); BRONZE_OBJS.append(o)
    # 冠
    bpy.ops.mesh.primitive_cylinder_add(radius=0.075 * s, depth=0.040 * s, vertices=12,
                                        location=(x, y, hz + 0.088 * s))
    o = bpy.context.object; o.data.materials.append(BR); BRONZE_OBJS.append(o)


# ---------------------------------------------------------------- 钟网格构建
def ring(verts, n, rx, ry, z, zfun=None):
    base = len(verts)
    for i in range(n):
        th = 2 * math.pi * i / n
        x = rx * math.sin(th)
        y = ry * math.cos(th)
        verts.append((x, y, z + (zfun(th) if zfun else 0.0)))
    return base


def bridge(faces, a, b, n):
    for i in range(n):
        j = (i + 1) % n
        faces.append((a + i, a + j, b + j, b + i))


def cap(verts, faces, base, n, z, flip=False):
    c = len(verts)
    verts.append((0.0, 0.0, z))
    for i in range(n):
        j = (i + 1) % n
        faces.append((base + j, c, base + i) if flip else (base + i, c, base + j))


def stud(verts, faces, cx, cy, cz, nx, ny, r, h, seg=6):
    ln = math.hypot(nx, ny) or 1.0
    nx, ny = nx / ln, ny / ln
    ux, uy = -ny, nx
    base = len(verts)
    for i in range(seg):
        a = 2 * math.pi * i / seg
        ca, sa = math.cos(a) * r, math.sin(a) * r
        verts.append((cx + ux * ca, cy + uy * ca, cz + sa))
    tip = len(verts)
    verts.append((cx + nx * h, cy + ny * h, cz))
    for i in range(seg):
        faces.append((base + i, base + (i + 1) % seg, tip))


def tube(verts, faces, cx, cy, z0, z1, r0, r1, n=10, cap_top=True):
    a = ring(verts, n, r0, r0, z0)
    b = ring(verts, n, r1, r1, z1)
    for i in range(n):
        verts[a + i] = (verts[a + i][0] + cx, verts[a + i][1] + cy, z0)
        verts[b + i] = (verts[b + i][0] + cx, verts[b + i][1] + cy, z1)
    bridge(faces, b, a, n)
    if cap_top:
        c = len(verts); verts.append((cx, cy, z1))
        for i in range(n):
            faces.append((b + i, c, b + (i + 1) % n))


def build_bell(R, H, bo=True, n=18):
    verts, faces = [], []
    A = 0.145 * H if bo else 0.0
    prof = [(0.00, 0.455, 0.655), (0.16, 0.485, 0.700),
            (0.42, 0.522, 0.772), (0.68, 0.562, 0.845),
            (0.88, 0.592, 0.888), (1.00, 0.600, 0.900)]
    rows = []
    for (t, sx, sy) in prof:
        zf = None
        if t > 0.68:
            k = (t - 0.68) / 0.32
            zf = (lambda th, k=k: k * A * (math.sin(th) ** 2))
        rows.append((ring(verts, n, R * sx, R * sy, -t * H, zf), R * sx, R * sy, -t * H))
    for i in range(len(rows) - 1):
        bridge(faces, rows[i][0], rows[i + 1][0], n)

    # 于口内翻 + 内腔
    zf_end = (lambda th: A * (math.sin(th) ** 2))
    i0 = ring(verts, n, R * 0.600 * 0.90, R * 0.900 * 0.90, -H, zf_end)
    bridge(faces, i0, rows[-1][0], n)
    i1 = ring(verts, n, R * 0.480, R * 0.700, -0.48 * H)
    i2 = ring(verts, n, R * 0.380, R * 0.550, -0.14 * H)
    bridge(faces, i1, i0, n)
    bridge(faces, i2, i1, n)
    cap(verts, faces, i2, n, -0.11 * H, flip=True)
    cap(verts, faces, rows[0][0], n, 0.0)

    # 篆带
    for t in (0.225, 0.365, 0.505):
        sx = 0.485 + (0.600 - 0.485) * t
        sy = 0.700 + (0.900 - 0.700) * t
        z = -t * H
        r1 = ring(verts, n, R * sx * 1.035, R * sy * 1.035, z + 0.012 * H)
        r2 = ring(verts, n, R * sx * 1.035, R * sy * 1.035, z - 0.012 * H)
        ra = ring(verts, n, R * sx, R * sy, z + 0.020 * H)
        rb = ring(verts, n, R * sx, R * sy, z - 0.020 * H)
        bridge(faces, ra, r1, n); bridge(faces, r1, r2, n); bridge(faces, r2, rb, n)

    # 枚
    sr, sh = R * 0.062, R * 0.085
    for t in (0.285, 0.425, 0.565):
        sx = 0.485 + (0.600 - 0.485) * t
        sy = 0.700 + (0.900 - 0.700) * t
        rx, ry = R * sx, R * sy
        z = -t * H
        for c in range(6):
            fy = (c - 2.5) / 2.5 * 0.60
            y = ry * fy
            x = rx * math.sqrt(max(0.0, 1.0 - fy * fy))
            for s in (1, -1):
                stud(verts, faces, s * x, y, z, s * 1.0, 0.0, sr, sh)

    # 鼓部圆涡纹敲击点
    for s in (1, -1):
        stud(verts, faces, s * R * 0.585, 0.0, -0.80 * H, s * 1.0, 0.0, R * 0.13, R * 0.035, seg=10)
    return verts, faces


def add_yong(verts, faces, R, H, style='yong'):
    if style == 'yong':
        hy = 0.40 * H
        tube(verts, faces, 0, 0, 0.0, hy, R * 0.135, R * 0.105, 10)
        z = hy * 0.46
        a = ring(verts, 12, R * 0.175, R * 0.175, z + 0.028 * H)
        b = ring(verts, 12, R * 0.175, R * 0.175, z - 0.028 * H)
        c1 = ring(verts, 12, R * 0.118, R * 0.118, z + 0.045 * H)
        c2 = ring(verts, 12, R * 0.118, R * 0.118, z - 0.045 * H)
        bridge(faces, c1, a, 12); bridge(faces, a, b, 12); bridge(faces, b, c2, 12)
        return hy
    else:
        hy = 0.30 * H
        n = 10
        for s in (1, -1):
            tube(verts, faces, 0, s * R * 0.24, 0.0, hy * 0.82, R * 0.060, R * 0.060, 8, cap_top=False)
        a = ring(verts, 8, R * 0.060, R * 0.060, hy * 0.82)
        for i in range(8):
            verts[a + i] = (verts[a + i][0], verts[a + i][1] - R * 0.24, verts[a + i][2])
        b = ring(verts, 8, R * 0.060, R * 0.060, hy * 0.82)
        for i in range(8):
            verts[b + i] = (verts[b + i][0], verts[b + i][1] + R * 0.24, verts[b + i][2])
        bridge(faces, a, b, 8)
        return hy


def new_obj(name, verts, faces, mat):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate(verbose=False)
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    return ob


def spread(a, b, groups):
    n = sum(groups)
    units = n + 0.75 * (len(groups) - 1)
    step = (b - a) / units
    out, cur = [], a + step * 0.5
    for g in groups:
        for _ in range(g):
            out.append(cur); cur += step
        cur += step * 0.75
    return out


# ---------------------------------------------------------------- main
purge()
BR = bronze_mat()
LAC = lac_mat()

# 木架：曲尺三层
for z in (Z_LOW, Z_MID, Z_TOP):
    beam(X0, ZD, X1, ZD, z)
    collar(X0 + 0.04, ZD, z); collar(X1 - 0.04, ZD, z)
    if z <= Z_MID:
        beam(X1, ZD, X1, ZD1, z)
        collar(X1, ZD1 - 0.04, z)
for (px, py, ztop) in ((X0, ZD, Z_TOP), (0.0, ZD, Z_TOP), (X1, ZD, Z_TOP), (X1, ZD1, Z_MID)):
    post(px, py, 0.0, ztop + BEAM_H / 2 + 0.08)
    collar(px, py, ztop + BEAM_H / 2 + 0.10, r=0.085, h=0.08)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.10, vertices=16, location=(px, py, 0.05))
    o = bpy.context.object; o.data.materials.append(LAC); LAC_OBJS.append(o)

# 铜人
for mx in (-2.42, 0.0, 2.42):
    bronze_man(mx, ZD - 0.16, Z_LOW - BEAM_H / 2, scale=1.0)
for mx in (-1.30, 1.30):
    bronze_man(mx, ZD - 0.16, Z_MID - BEAM_H / 2, scale=0.62)
bronze_man(X1 - 0.16, ZD1 - 1.05, Z_LOW - BEAM_H / 2, scale=0.85)

# 钟
BELLS = [
    ('low', [4, 4], [4], 0.232, 1.00, Z_LOW, 'yong'),
    ('mid', [7, 8, 7], [5, 6], 0.143, 0.560, Z_MID, 'yong'),
    ('top', [4, 5, 4], [3, 3], 0.088, 0.292, Z_TOP, 'niu'),
]
for (tag, gl, gs, R, H, zbeam, style) in BELLS:
    hang_z = zbeam - BEAM_H / 2
    xs = spread(X0 + 0.42, X1 - 0.42, gl)
    for i, x in enumerate(xs):
        v, f = build_bell(R, H); hy = add_yong(v, f, R, H, style)
        ob = new_obj(f'bell-{tag}-L{i}', v, f, BR)
        ob.location = (x, ZD, hang_z - hy)
        BRONZE_OBJS.append(ob)
    ys = spread(ZD + 0.55, ZD1 - 0.35, gs)
    for i, y in enumerate(ys):
        v, f = build_bell(R, H); hy = add_yong(v, f, R, H, style)
        ob = new_obj(f'bell-{tag}-S{i}', v, f, BR)
        if tag == 'top':
            ob.location = (X1, y, Z_MID + 0.62 - hy)
        else:
            ob.location = (X1, y, hang_z - hy)
        ob.rotation_euler[2] = math.pi / 2
        BRONZE_OBJS.append(ob)

# 楚王镈
v, f = build_bell(0.255, 0.86, bo=False); hy = add_yong(v, f, 0.255, 0.86, 'niu')
bo = new_obj('bo-chuwang', v, f, BR)
bo.location = (X1 - 0.30, ZD, Z_LOW - BEAM_H / 2 - hy)
BRONZE_OBJS.append(bo)


def join_group(group, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in group:
        o.select_set(True)
    bpy.context.view_layer.objects.active = group[0]
    bpy.ops.object.join()
    merged = bpy.context.object
    merged.name = name
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.uv.smart_project(island_margin=0.015, angle_limit=1.15)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return merged


bronze = join_group(BRONZE_OBJS, 'Bronze')
lac = join_group(LAC_OBJS, 'Lacquer')

minz = min((o.matrix_world @ v.co).z for o in (bronze, lac) for v in o.data.vertices)
for o in (bronze, lac):
    o.location.z -= minz
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

print(f'[bianzhong] 钟件数 ≈ 65 | bronze 顶点 {len(bronze.data.vertices)} 面 {len(bronze.data.polygons)} | '
      f'lac 顶点 {len(lac.data.vertices)} 面 {len(lac.data.polygons)}')

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
bronze.select_set(True); lac.select_set(True)
bpy.context.view_layer.objects.active = bronze
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format='GLB', use_selection=True,
    export_apply=True, export_materials='EXPORT', export_image_format='AUTO',
)
print('[bianzhong] 导出完成 ->', OUT)
