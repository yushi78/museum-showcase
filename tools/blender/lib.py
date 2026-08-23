#!/usr/bin/env python3
# 共享建模库：材质 + 旋转体(lathe, 带 UV) + 几何小工具
import bpy, math, os
import bmesh
from mathutils import Vector

ROOT = r"D:\workButty小程序\museum-showcase"
TEX = os.path.join(ROOT, "tools", "blender", "out", "tex")


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    for i in list(bpy.data.images):
        bpy.data.images.remove(i)


def load_img(path, srgb=True):
    im = bpy.data.images.load(path)
    im.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'
    return im


def mat_pbr(name, base_img=None, rough_img=None, normal_img=None,
            metalness=0.0, roughness=0.5, base_color=(1, 1, 1, 1),
            normal_strength=0.8, alpha=1.0, transmission=0.0, ior=1.45):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    # 按类型查找原理化 BSDF（兼容中文/英文 Blender 构建的节点名差异）
    bsdf = None
    for n in nt.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            bsdf = n
            break
    if bsdf is None:
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Metallic'].default_value = metalness
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Base Color'].default_value = base_color
    if alpha < 1.0:
        mat.blend_method = 'BLEND'
        mat.use_backface_culling = False
        bsdf.inputs['Alpha'].default_value = alpha
    if transmission > 0.0:
        bsdf.inputs['Transmission Weight'].default_value = transmission
        bsdf.inputs['IOR'].default_value = ior
        bsdf.inputs['Roughness'].default_value = min(roughness, 0.25)
    x = -420
    if base_img:
        tn = nt.nodes.new('ShaderNodeTexImage')
        tn.image = load_img(os.path.join(TEX, base_img), True)
        tn.location = (x, 320)
        nt.links.new(tn.outputs['Color'], bsdf.inputs['Base Color'])
    if rough_img:
        rn = nt.nodes.new('ShaderNodeTexImage')
        rn.image = load_img(os.path.join(TEX, rough_img), False)
        rn.location = (x, 60)
        nt.links.new(rn.outputs['Color'], bsdf.inputs['Roughness'])
    if normal_img:
        nn = nt.nodes.new('ShaderNodeTexImage')
        nn.image = load_img(os.path.join(TEX, normal_img), False)
        nn.location = (x, -200)
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nm.location = (-180, -180)
        nm.inputs['Strength'].default_value = normal_strength
        nt.links.new(nn.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


def lathe(profile, segs=64, name='lathe', caps='both'):
    """profile: list of (r, y) bottom->top. 生成带 UV 的旋转体。
    UV: u=角度/segs, v=分段索引/(n-1)"""
    bm = bmesh.new()
    n = len(profile)
    uv = {}
    # 1) 先创建所有顶点（含上下封口中心）
    for i in range(n):
        for j in range(segs):
            ang = 2 * math.pi * j / segs
            v = bm.verts.new((profile[i][0] * math.cos(ang), profile[i][1], profile[i][0] * math.sin(ang)))
            uv[v.index] = (j / segs, i / (n - 1))
    cbot = ctop = None
    if caps in ('bottom', 'both'):
        cbot = bm.verts.new((0, profile[0][1], 0)); uv[cbot.index] = (0.5, 0)
    if caps in ('top', 'both'):
        ctop = bm.verts.new((0, profile[-1][1], 0)); uv[ctop.index] = (0.5, 1)
    bm.verts.ensure_lookup_table()
    # 2) 再建所有面
    for i in range(n - 1):
        for j in range(segs):
            j2 = (j + 1) % segs
            a = i * segs + j; b = i * segs + j2
            c = (i + 1) * segs + j2; d = (i + 1) * segs + j
            bm.faces.new((bm.verts[a], bm.verts[b], bm.verts[c], bm.verts[d]))
    if cbot is not None:
        for j in range(segs):
            a = 0 * segs + j; b = 0 * segs + (j + 1) % segs
            bm.faces.new((cbot, bm.verts[b], bm.verts[a]))
    if ctop is not None:
        base = (n - 1) * segs
        for j in range(segs):
            a = base + j; b = base + (j + 1) % segs
            bm.faces.new((ctop, bm.verts[a], bm.verts[b]))
    ul = bm.loops.layers.uv.verify()
    for f in bm.faces:
        for l in f.loops:
            l[ul].uv = uv[l.vert.index]
    bm.normal_update()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    fix_normals(o)
    return o


def rounded_box(w, h, d, r=0.02, seg=3, name='rounded_box'):
    """圆角长方体，基于 cube + subdivision + cast"""
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object
    o.name = name
    o.scale = (w, h, d)
    o.location = (0, 0, 0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if r > 0.001 and seg > 0:
        bpy.ops.object.modifier_add(type='BEVEL')
        mod = o.modifiers[-1]
        mod.width = r
        mod.segments = seg
        mod.limit_method = 'ANGLE'
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o


def fix_normals(obj):
    """用 bmesh 把每个面的法线翻转向外侧（以原点为参考中心）"""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    for f in bm.faces:
        c = f.calc_center_median()
        if f.normal.dot(c) < 0:
            f.normal_flip()
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()


def Vector_(t):
    from mathutils import Vector
    return Vector(t)


def tube(p0, p1, r, segs=16, name='tube'):
    """两点间圆柱（沿 Z 建模后对齐到方向）"""
    from mathutils import Vector, Quaternion
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=1, vertices=segs)
    o = bpy.context.object
    o.name = name
    a = Vector(p0); b = Vector(p1)
    d = b - a
    o.location = (a + b) / 2.0
    o.scale.z = d.length
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = q
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o


def bezier_tube(points, r, segs=12, name='curve'):
    """用贝塞尔曲线 + 圆截面生成管（龙柄/凤冠龙身）"""
    from mathutils import Vector
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    sp = curve.splines.new('BEZIER')
    sp.bezier_points.add(len(points) - 1)
    for i, p in enumerate(points):
        bp = sp.bezier_points[i]
        bp.co = Vector(p)
        bp.handle_left_type = 'AUTO'; bp.handle_right_type = 'AUTO'
    curve.bevel_depth = r
    curve.bevel_resolution = 3
    curve.resolution_u = 12
    o = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    return o


def loft_sections(sections, name='loft', cap_ends=True):
    """Create a continuous quad surface through matched closed sections.

    Each section is a list of XYZ points with identical vertex count.  This is
    the preferred helper for recognisable body shells: cars, aircraft cabins,
    furniture skins and organic/mechanical housings.  Unlike stacked boxes it
    produces one readable silhouette with continuous highlights.
    """
    if len(sections) < 2 or len(sections[0]) < 3:
        raise ValueError('loft_sections needs at least two 3-point sections')
    count = len(sections[0])
    if any(len(s) != count for s in sections):
        raise ValueError('all loft sections must have the same point count')
    verts = [tuple(p) for section in sections for p in section]
    faces = []
    for row in range(len(sections) - 1):
        a = row * count; b = (row + 1) * count
        for col in range(count):
            nxt = (col + 1) % count
            faces.append((a + col, a + nxt, b + nxt, b + col))
    if cap_ends:
        faces.append(tuple(reversed(range(count))))
        end = (len(sections) - 1) * count
        faces.append(tuple(end + i for i in range(count)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = True
    bevel = obj.modifiers.new('edge_softening', 'BEVEL')
    bevel.width = 0.006
    bevel.segments = 2
    bevel.limit_method = 'ANGLE'
    return obj


def stand_up_rotate_x(objs):
    """把沿 Blender Y 轴（高度）的物体整体绕 X 轴 +90°，使 Y->Z（高度），
    原 Z 前后变为 -Y。适合恐龙骨架/竖直石柱/横放原木等保持原 X 长轴的模型。"""
    for o in objs:
        if not (o and o.name in bpy.data.objects):
            continue
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        bpy.ops.transform.rotate(value=math.pi / 2, orient_axis='X')
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
        mn = min(v.co.y for v in o.data.vertices)
        for v in o.data.vertices:
            v.co.y -= mn
        fix_normals(o)


def stand_up_auto(objs):
    """自动把物体的最长本地轴转到 Blender Z 轴（导出后在 GLB Y-up 中即为竖直高度）。
    先 apply 变换，比较 X/Y/Z 三轴跨度，绕对应轴旋转 90°，再贴地并修复法线。"""
    for o in objs:
        if not (o and o.name in bpy.data.objects):
            continue
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        xs = [v.co.x for v in o.data.vertices]
        ys = [v.co.y for v in o.data.vertices]
        zs = [v.co.z for v in o.data.vertices]
        dx, dy, dz = max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)
        if dy >= dx and dy >= dz:
            # 高在 Y，绕 X +90°：Y->Z
            bpy.ops.transform.rotate(value=math.pi / 2, orient_axis='X')
        elif dx >= dy and dx >= dz:
            # 高在 X，绕 Z -90°：X->Y->Z（两次旋转等效为 X 对齐到 Z）
            # 更直接：绕 Y +90° 把 X 高转到 Z 高
            bpy.ops.transform.rotate(value=math.pi / 2, orient_axis='Y')
        # 否则 Z 已经是最高，不旋转
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
        mn = min(v.co.y for v in o.data.vertices)
        for v in o.data.vertices:
            v.co.y -= mn
        fix_normals(o)


def stand_up_swap_xyz(objs):
    """坐标置换 (x,y,z) -> (z,x,y)：原 X 长轴变为展厅前后(Y)，
    原 Y 高度变为高度(Z)，原 Z 前后变为左右(X)。
    适合四足动物标本，使其身体长轴沿展厅前后方向站立。"""
    for o in objs:
        if not (o and o.name in bpy.data.objects):
            continue
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        for v in o.data.vertices:
            x, y, z = v.co
            v.co = (z, x, y)
        mn = min(v.co.y for v in o.data.vertices)
        for v in o.data.vertices:
            v.co.y -= mn
        fix_normals(o)


def export_glb(path):
    for o in bpy.data.objects:
        if o.type == 'MESH':
            fix_normals(o)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB',
                              use_selection=False, export_apply=True,
                              export_materials='EXPORT', export_image_format='AUTO')
