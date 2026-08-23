#!/usr/bin/env python3
# 程序化贴图生成（Pillow 写 PNG，供 Blender 内嵌）
# 青铜/玉：旧版基础上增加法线贴图（高度场梯度）
# 新增：元青花 / 鸡缸杯 / 希腊陶罐 / 甲骨文 / 龙袍 五套贴图
import os, math, random
from PIL import Image, ImageDraw

random.seed(20260802)
S = 512
ROOT = r"D:\workButty小程序\museum-showcase"
OUT = os.path.join(ROOT, "tools", "blender", "out", "tex")


def fbm(x, y, seed, oct):
    v = 0.0; a = 0.5; fx = x; fy = y
    for _ in range(oct):
        n = math.sin(fx * 12.9898 + fy * 78.233 + seed * 3.17) * 43758.5453
        n = n - math.floor(n)
        v += a * n
        fx *= 2.0; fy *= 2.0; a *= 0.5
    return v


def clamp(v, a, b):
    return max(a, min(b, v))


def lerp3(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def write_png(path, rgba):
    im = Image.new('RGBA', (S, S)); im.putdata(rgba); im.save(path)


def write_rgb(path, rgb):
    im = Image.new('RGB', (S, S)); im.putdata(rgb); im.save(path)


def normal_from(H, strength=2.2):
    out = []
    for y in range(S):
        for x in range(S):
            xl = H[y][(x - 1) % S]; xr = H[y][(x + 1) % S]
            yd = H[(y - 1) % S][x]; yu = H[(y + 1) % S][x]
            dx = (xl - xr) * strength; dy = (yd - yu) * strength
            L = math.sqrt(dx * dx + dy * dy + 1.0)
            out.append((int((dx / L * 0.5 + 0.5) * 255),
                        int((dy / L * 0.5 + 0.5) * 255),
                        int((1.0 / L * 0.5 + 0.5) * 255)))
    return out


def _base_path(name):
    """按命名约定找到 base 图：优先 {name}.png，其次 {name}_base.png"""
    p = os.path.join(OUT, name + '.png')
    return p if os.path.exists(p) else os.path.join(OUT, name + '_base.png')


def pbr_from_base(name, rough_base=0.4, rough_var=0.25, relief=1.8, invert_h=False):
    """由已保存的 base 图亮度推导高度场，生成 rough + normal 两张贴图。
    rough_base: 基础粗糙度(0~1)；rough_var: 粗糙度随高度的波动幅度；
    relief: 法线强度；invert_h: 是否反转高度（暗凸亮凹，用于刻痕类）。
    """
    im = Image.open(_base_path(name)).convert('RGB')
    px = im.load()
    H = []
    for y in range(S):
        row = []
        for x in range(S):
            r, g, b = px[x, y]
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
            row.append((1.0 - lum) if invert_h else lum)
        H.append(row)
    write_rgb(os.path.join(OUT, name + '_normal.png'), normal_from(H, strength=relief))
    rbuf = []
    for y in range(S):
        for x in range(S):
            h = H[y][x]
            r = clamp(rough_base + (0.5 - h) * rough_var * 2, 0.04, 0.97)
            v = int(r * 255)
            rbuf.append((v, v, v, 255))
    write_png(os.path.join(OUT, name + '_rough.png'), rbuf)
    print(name + ': +rough+normal')


def normal_from_base(name, relief=1.6, invert_h=False):
    """仅为已有 base 图的材质补一张 normal 贴图（如 silver 已有 rough）。"""
    im = Image.open(_base_path(name)).convert('RGB')
    px = im.load()
    H = []
    for y in range(S):
        row = []
        for x in range(S):
            r, g, b = px[x, y]
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
            row.append((1.0 - lum) if invert_h else lum)
        H.append(row)
    write_rgb(os.path.join(OUT, name + '_normal.png'), normal_from(H, strength=relief))
    print(name + ': +normal')


# ---------------- 青铜（受沁暗青铜 + 铜绿 + 法线）----------------
def bronze():
    base = (88, 82, 62)
    patina = (50, 95, 78)
    dark = (36, 32, 24)
    buf, rbuf, H = [], [], []
    for y in range(S):
        Hrow = []
        for x in range(S):
            fx, fy = x / S * 5, y / S * 5
            n = fbm(fx, fy, 11, 6)
            m = fbm(fx * 2.3 + 50, fy * 2.3 + 50, 23, 5)
            pat = clamp((n - 0.42) * 2.6, 0, 1) * clamp((m + 0.35), 0, 1)
            col = lerp3(base, patina, pat)
            col = lerp3(col, dark, (1 - n) * 0.55)
            grain = (fbm(fx * 22, fy * 22, 7, 3) - 0.5) * 16
            col = tuple(clamp(int(c + grain), 0, 255) for c in col)
            buf.append(col + (255,))
            rough = int(clamp(0.42 + pat * 0.45 + (1 - n) * 0.30, 0.28, 0.95) * 255)
            rbuf.append((rough, rough, rough, 255))
            # 高度：颗粒凸起 + 铜绿低洼
            Hrow.append(n * 0.6 + (1 - pat) * 0.3 + fbm(fx * 22, fy * 22, 7, 3) * 0.2)
        H.append(Hrow)
    write_png(os.path.join(OUT, 'bronze_base.png'), buf)
    write_png(os.path.join(OUT, 'bronze_rough.png'), rbuf)
    write_rgb(os.path.join(OUT, 'bronze_normal.png'), normal_from(H))
    print('bronze: base+rough+normal')


# ---------------- 玉（青白玉 + 玉筋 + 法线）----------------
def jade():
    base = (158, 205, 170)
    vein = (110, 168, 138)
    buf, rbuf, H = [], [], []
    for y in range(S):
        Hrow = []
        for x in range(S):
            fx, fy = x / S * 4, y / S * 4
            n = fbm(fx, fy, 41, 5)
            streak = abs(fbm(fx * 0.6, fy * 6, 53, 4) - 0.5)
            col = lerp3(base, vein, clamp(streak * 2.4, 0, 1))
            col = lerp3(col, (205, 238, 214), (n - 0.5) * 0.3)
            col = tuple(clamp(int(c), 0, 255) for c in col)
            buf.append(col + (255,))
            rough = int(clamp(0.18 + (1 - n) * 0.25, 0.1, 0.5) * 255)
            rbuf.append((rough, rough, rough, 255))
            Hrow.append(streak * 0.8 + (1 - n) * 0.3)
        H.append(Hrow)
    write_png(os.path.join(OUT, 'jade_base.png'), buf)
    write_png(os.path.join(OUT, 'jade_rough.png'), rbuf)
    write_rgb(os.path.join(OUT, 'jade_normal.png'), normal_from(H))
    print('jade: base+rough+normal')


# ---------------- 银（复用旧版，无改动）----------------
def silver():
    base = (205, 205, 210)
    gold = (180, 140, 50)
    buf, rbuf = [], []
    for y in range(S):
        for x in range(S):
            fx, fy = x / S * 6, y / S * 6
            n = fbm(fx, fy, 61, 5)
            col = lerp3(base, gold, clamp((fbm(fx * 1.5, fy * 1.5, 71, 4) - 0.55) * 4, 0, 1))
            grain = (fbm(fx * 30, fy * 30, 9, 3) - 0.5) * 10
            col = tuple(clamp(int(c + grain), 0, 255) for c in col)
            buf.append(col + (255,))
            rough = int(clamp(0.30 + (1 - n) * 0.3, 0.15, 0.6) * 255)
            rbuf.append((rough, rough, rough, 255))
    write_png(os.path.join(OUT, 'silver_base.png'), buf)
    write_png(os.path.join(OUT, 'silver_rough.png'), rbuf)
    print('silver: base+rough')


# ---------------- 元青花梅瓶 ----------------
def yuan_blue():
    # 元青花：苏麻离青浓艳钴蓝 + 铁锈斑 + 卵白釉
    base = (243, 245, 240)
    W = Image.new('RGB', (S, S), base)
    d = ImageDraw.Draw(W)
    cobalt = (22, 42, 105)
    rust = (138, 78, 42)
    random.seed(11)
    # 釉面微黄不均底
    for _ in range(8000):
        x, y = random.randint(0, S - 1), random.randint(0, S - 1)
        if random.random() < 0.5:
            W.putpixel((x, y), (240, 242, 235))
    # 口沿 / 胫部 弦纹带
    for y0 in (18, 24, 455, 465):
        d.rectangle([0, y0, S, y0 + 4], fill=cobalt)
    # 肩部如意云头纹
    for cx in range(-20, S + 40, 70):
        d.polygon([(cx, 55), (cx + 35, 55), (cx + 28, 95), (cx + 7, 95)], fill=cobalt)
        if random.random() < 0.4:
            d.ellipse([cx + 12, 65, cx + 22, 85], fill=rust)
    # 腹部主题带
    d.rectangle([0, 130, S, 390], fill=base)
    # 远山/江岸
    d.line([0, 370, S, 370], fill=cobalt, width=4)
    d.line([0, 375, S, 375], fill=cobalt, width=2)
    # 松树
    d.line([90, 370, 115, 180], fill=cobalt, width=7)
    for k in range(8):
        sx = 115 + (k % 2) * 35 + random.randint(-8, 8)
        sy = 190 + k * 20
        d.line([115, sy, sx, sy - 15], fill=cobalt, width=3)
        d.ellipse([sx - 10, sy - 25, sx + 10, sy - 5], fill=cobalt)
    # 两骑马人物（萧何追韩信）
    for cx in (260, 380):
        # 马身
        d.ellipse([cx - 42, 260, cx + 42, 335], fill=cobalt)
        d.ellipse([cx + 25, 230, cx + 55, 280], fill=cobalt)  # 马颈/头
        d.line([cx - 30, 335, cx - 30, 365], fill=cobalt, width=5)
        d.line([cx + 25, 335, cx + 25, 365], fill=cobalt, width=5)
        # 骑手
        d.ellipse([cx - 8, 215, cx + 22, 255], fill=cobalt)
        d.ellipse([cx + 2, 195, cx + 20, 215], fill=cobalt)
        # 铁锈斑
        for _ in range(5):
            rx = cx + random.randint(-40, 40)
            ry = random.randint(260, 335)
            d.ellipse([rx - 3, ry - 3, rx + 3, ry + 3], fill=rust)
    # 缠枝花点缀
    for cx in range(30, S, 100):
        d.ellipse([cx - 14, 300, cx + 14, 328], outline=cobalt, width=3)
        d.line([cx, 286, cx, 300], fill=cobalt, width=3)
        d.line([cx - 10, 292, cx + 10, 292], fill=cobalt, width=3)
    W.save(os.path.join(OUT, 'yuan_blue.png'))
    print('yuan_blue')


# ---------------- 成化斗彩鸡缸杯 ----------------
def chicken_cup():
    W = Image.new('RGB', (S, S), (247, 248, 250))
    d = ImageDraw.Draw(W)
    blue = (40, 70, 140)
    red = (200, 60, 55)
    green = (70, 150, 70)
    yellow = (225, 185, 60)
    # 上下弦纹
    d.rectangle([0, 40, S, 48], fill=blue)
    d.rectangle([0, 460, S, 468], fill=blue)
    # 两组子母鸡 + 湖石花草
    for gx in (0, S // 2):
        # 湖石
        d.ellipse([gx + 30, 250, gx + 120, 360], outline=blue, width=4)
        # 母鸡
        d.ellipse([gx + 60, 200, gx + 150, 300], fill=red)
        d.ellipse([gx + 95, 165, gx + 130, 200], fill=yellow)   # 头
        d.polygon([(gx + 130, 175), (gx + 150, 168), (gx + 132, 188)], fill=red)  # 喙
        d.line([gx + 70, 300, gx + 70, 340], fill=red, width=5)  # 腿
        d.line([gx + 140, 300, gx + 140, 340], fill=red, width=5)
        # 公鸡
        d.ellipse([gx + 180, 190, gx + 270, 290], fill=green)
        d.ellipse([gx + 215, 155, gx + 250, 190], fill=yellow)
        d.polygon([(gx + 250, 165), (gx + 270, 158), (gx + 252, 178)], fill=red)
        d.line([gx + 195, 290, gx + 195, 330], fill=green, width=5)
        # 小鸡
        d.ellipse([gx + 150, 320, gx + 185, 360], fill=yellow)
    W.save(os.path.join(OUT, 'chicken_cup.png'))
    print('chicken_cup')


# ---------------- 希腊黑绘陶罐 ----------------
def amphora():
    W = Image.new('RGB', (S, S), (184, 96, 52))
    d = ImageDraw.Draw(W)
    black = (22, 20, 22)
    # 上下弦纹
    for y0 in (40, 46, 430, 436):
        d.rectangle([0, y0, S, y0 + 5], fill=black)
    # 颈部回纹带
    for i in range(0, S, 24):
        d.rectangle([i + 4, 60, i + 18, 78], outline=black, width=3)
    # A 面：雅典娜持矛盾立于双柱间
    # 双柱
    d.rectangle([150, 150, 175, 320], fill=black)
    d.rectangle([337, 150, 362, 320], fill=black)
    d.rectangle([145, 140, 180, 152], fill=black)   # 柱头
    d.rectangle([332, 140, 367, 152], fill=black)
    d.ellipse([160, 128, 180, 142], fill=black)      # 柱头鸡冠
    d.ellipse([342, 128, 362, 142], fill=black)
    # 雅典娜身
    d.ellipse([215, 200, 285, 330], fill=black)
    d.ellipse([238, 165, 262, 200], fill=black)      # 头
    d.line([262, 220, 305, 200], fill=black, width=6)  # 矛
    d.line([215, 250, 185, 300], fill=black, width=5)  # 盾/臂
    # B 面：竞技场景（两跑者）
    for cx in (200, 320):
        d.ellipse([cx - 25, 200, cx + 25, 290], fill=black)
        d.line([cx, 245, cx + 40, 210], fill=black, width=5)
        d.line([cx - 20, 290, cx - 40, 330], fill=black, width=5)
    W.save(os.path.join(OUT, 'amphora.png'))
    print('amphora')


# ---------------- 甲骨文牛肩胛骨 ----------------
def oracle():
    # 牛肩胛骨：黄褐骨色 + 裂纹 + 朱墨卜辞
    W = Image.new('RGB', (S, S), (218, 205, 175))
    d = ImageDraw.Draw(W)
    ink = (88, 38, 32)
    red = (165, 52, 42)
    crack = (120, 100, 75)
    random.seed(7)
    # 骨面沁色不均
    for _ in range(6000):
        x, y = random.randint(0, S - 1), random.randint(0, S - 1)
        if random.random() < 0.5:
            W.putpixel((x, y), (206, 192, 162))
        else:
            W.putpixel((x, y), (228, 216, 188))
    # 裂纹
    for _ in range(12):
        x, y = random.randint(0, S), random.randint(0, S)
        pts = [(x, y)]
        for _ in range(random.randint(3, 7)):
            pts.append((pts[-1][0] + random.randint(-30, 30), pts[-1][1] + random.randint(-30, 30)))
        d.line(pts, fill=crack, width=random.choice([1, 2]))
    # 钻凿小坑（兆痕）
    for _ in range(35):
        cx = random.randint(40, S - 40); cy = random.randint(40, S - 40)
        d.ellipse([cx - 5, cy - 7, cx + 5, cy + 7], outline=(150, 130, 100), width=2)
        d.ellipse([cx - 2, cy - 3, cx + 2, cy + 3], fill=(120, 105, 80))
    # 刻辞：随机「甲骨文字」笔画
    for _ in range(32):
        cx = random.randint(60, S - 60); cy = random.randint(60, S - 60)
        col = red if random.random() < 0.25 else ink
        n = random.randint(2, 5)
        for k in range(n):
            dx = random.randint(-20, 20); dy = random.randint(-20, 20)
            d.line([cx, cy, cx + dx, cy + dy], fill=col, width=random.choice([2, 3, 4]))
            cx += dx; cy += dy
        d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=col)
    W.save(os.path.join(OUT, 'oracle.png'))
    print('oracle')


# ---------------- 明黄缂丝龙袍 ----------------
def dragon_robe():
    W = Image.new('RGB', (S, S), (232, 188, 46))
    d = ImageDraw.Draw(W)
    blue = (28, 66, 140)
    gold = (210, 170, 60)
    # 九龙：上下两行盘龙（抽象 S 形 + 头）
    for row, yc in enumerate((140, 370)):
        for cx in range(70, S, 130):
            d.line([cx, yc - 40, cx + 40, yc, cx, yc + 40, cx - 40, yc, cx, yc - 40],
                   fill=blue, width=10, joint='curve')
            d.ellipse([cx - 14, yc - 16, cx + 14, yc + 16], outline=gold, width=6)
            d.ellipse([cx - 6, yc - 6, cx + 6, yc + 6], fill=blue)
    # 下摆海水江崖
    for cx in range(0, S, 40):
        d.polygon([(cx, 470), (cx + 20, 410), (cx + 40, 470)], outline=blue, width=3)
    d.line([0, 480, S, 480], fill=blue, width=4)
    # 十二章纹（小标记点阵）
    for i, (cx, cy) in enumerate([(60 + (i % 6) * 80, 60 + (i // 6) * 30) for i in range(12)]):
        d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], outline=gold, width=3)
    W.save(os.path.join(OUT, 'dragon_robe.png'))
    print('dragon_robe')


# ==================== 自然历史馆 ====================
def bone():
    base = (226, 216, 190)
    buf, rbuf, H = [], [], []
    for y in range(S):
        Hrow = []
        for x in range(S):
            fx, fy = x / S * 6, y / S * 6
            n = fbm(fx, fy, 91, 5)
            col = lerp3(base, (205, 190, 162), clamp((n - 0.5) * 1.2, 0, 1))
            col = lerp3(col, (182, 166, 136), (1 - n) * 0.35)
            grain = (fbm(fx * 26, fy * 26, 17, 3) - 0.5) * 14
            col = tuple(clamp(int(c + grain), 0, 255) for c in col)
            buf.append(col + (255,))
            rough = int(clamp(0.62 + (1 - n) * 0.25, 0.5, 0.95) * 255)
            rbuf.append((rough, rough, rough, 255))
            Hrow.append(n * 0.5 + (1 - n) * 0.3)
        H.append(Hrow)
    write_png(os.path.join(OUT, 'bone_base.png'), buf)
    write_png(os.path.join(OUT, 'bone_rough.png'), rbuf)
    write_rgb(os.path.join(OUT, 'bone_normal.png'), normal_from(H))
    print('bone')


def fur_orange():
    # 东北虎：浅赭黄底 + 褐黑横纹
    base = (228, 178, 108)
    W = Image.new('RGB', (S, S), base)
    d = ImageDraw.Draw(W)
    stripe = (42, 32, 28)
    random.seed(3)
    for _ in range(22000):
        x, y = random.randint(0, S - 1), random.randint(0, S - 1)
        if random.random() < 0.45:
            W.putpixel((x, y), (220, 170, 100))
        else:
            W.putpixel((x, y), (236, 188, 118))
    for cx in range(-40, S + 40, 44):
        for off in random.sample(range(0, S), random.randint(4, 7)):
            w = random.randint(3, 9)
            ang = 8 * math.sin(off / 38.0)
            d.line([(cx + ang, off - 32), (cx, off), (cx - ang, off + 32)], fill=stripe, width=w)
    # 臀部 Y 形分叉
    for cx in range(0, S, 120):
        d.line([(cx, 300), (cx + 20, 360)], fill=stripe, width=6)
        d.line([(cx + 20, 360), (cx, 420)], fill=stripe, width=6)
    W.save(os.path.join(OUT, 'fur_orange.png'))
    print('fur_orange')


def fur_golden():
    base = (222, 165, 58)
    W = Image.new('RGB', (S, S), base)
    random.seed(5)
    for _ in range(24000):
        x, y = random.randint(0, S - 1), random.randint(0, S - 1)
        if random.random() < 0.5:
            W.putpixel((x, y), (210, 150, 48))
        else:
            W.putpixel((x, y), (234, 182, 74))
    W.save(os.path.join(OUT, 'fur_golden.png'))
    print('fur_golden')


def fur_white():
    base = (240, 238, 232)
    W = Image.new('RGB', (S, S), base)
    random.seed(9)
    for _ in range(16000):
        x, y = random.randint(0, S - 1), random.randint(0, S - 1)
        if random.random() < 0.5:
            W.putpixel((x, y), (231, 229, 223))
        else:
            W.putpixel((x, y), (248, 246, 240))
    W.save(os.path.join(OUT, 'fur_white.png'))
    print('fur_white')


def petrified():
    # 硅化木横截：同心年轮 + 放射裂隙 + 红黄绿玛瑙
    W = Image.new('RGB', (S, S), (120, 70, 55))
    d = ImageDraw.Draw(W)
    cx, cy = S / 2, S / 2
    random.seed(13)
    for k in range(44):
        ang = random.uniform(0, 2 * math.pi)
        d.line([(cx, cy), (cx + math.cos(ang) * S / 2, cy + math.sin(ang) * S / 2)], fill=(58, 38, 48), width=random.randint(1, 3))
    for r in range(8, S // 2, 9):
        col = random.choice([(150, 80, 55), (182, 140, 62), (92, 122, 82), (200, 162, 92), (72, 92, 112), (170, 60, 70)])
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=random.randint(2, 5))
    W.save(os.path.join(OUT, 'petrified.png'))
    print('petrified')


def basalt():
    base = (54, 56, 60)
    buf = []
    for y in range(S):
        for x in range(S):
            fx, fy = x / S * 7, y / S * 7
            n = fbm(fx, fy, 131, 5)
            col = lerp3(base, (40, 42, 46), (1 - n) * 0.6)
            col = lerp3(col, (96, 80, 60), clamp((n - 0.72) * 1.5, 0, 1) * 0.5)
            grain = (fbm(fx * 30, fy * 30, 19, 3) - 0.5) * 10
            col = tuple(clamp(int(c + grain), 0, 255) for c in col)
            buf.append(col + (255,))
    write_png(os.path.join(OUT, 'basalt_base.png'), buf)
    print('basalt')


def meteorite_wid():
    # 维斯台登纹：金属灰底 + 亮带三角网格
    W = Image.new('RGB', (S, S), (150, 150, 155))
    d = ImageDraw.Draw(W)
    random.seed(21)
    for _ in range(30000):
        x, y = random.randint(0, S - 1), random.randint(0, S - 1)
        v = random.randint(-12, 12)
        W.putpixel((x, y), (150 + v, 150 + v, 155 + v))
    bright = (228, 228, 232)
    for ang in (0, math.pi / 3, 2 * math.pi / 3):
        for off in range(-S, S, 15):
            pts = [(int(off + math.cos(ang) * t), int(math.sin(ang) * t)) for t in range(0, S, 8)]
            d.line(pts, fill=bright, width=2)
    for _ in range(34):
        x, y = random.randint(0, S - 1), random.randint(0, S - 1)
        d.ellipse([x - 12, y - 12, x + 12, y + 12], fill=(108, 108, 114))
    W.save(os.path.join(OUT, 'meteorite_wid.png'))
    print('meteorite_wid')


def rock_matrix():
    # 化石围岩：浅灰米黄纹层
    base = (206, 201, 186)
    buf = []
    for y in range(S):
        for x in range(S):
            fx, fy = x / S * 5, y / S * 5
            n = fbm(fx, fy, 151, 4)
            col = lerp3(base, (190, 185, 170), (1 - n) * 0.5)
            col = lerp3(col, (216, 211, 198), (n - 0.6) * 0.5)
            line = abs(math.sin(fy * 20))
            if line < 0.08:
                col = tuple(int(c * 0.9) for c in col)
            col = tuple(clamp(int(c), 0, 255) for c in col)
            buf.append(col + (255,))
    write_png(os.path.join(OUT, 'rock_matrix.png'), buf)
    print('rock_matrix')


if __name__ == '__main__':
    # 已有完整 base+rough+normal 的三套
    bronze(); jade(); bone()

    # 仅 base，需补 rough+normal
    yuan_blue(); chicken_cup(); amphora(); oracle(); dragon_robe()
    fur_orange(); fur_golden(); fur_white()
    petrified(); basalt(); meteorite_wid(); rock_matrix()

    # 银已有 base+rough，仅补 normal
    silver()

    # ---- 补齐 rough + normal ----
    # 瓷器（釉面光滑，轻微起伏，暗色钴蓝纹略凹陷）
    pbr_from_base('yuan_blue', rough_base=0.10, rough_var=0.10, relief=0.55, invert_h=True)
    pbr_from_base('chicken_cup', rough_base=0.10, rough_var=0.10, relief=0.55, invert_h=True)
    # 黑绘陶罐（黑绘微凸 + 陶面颗粒）
    pbr_from_base('amphora', rough_base=0.50, rough_var=0.20, relief=1.7, invert_h=True)
    # 甲骨（刻辞凹陷 + 钻凿坑 + 骨质颗粒）
    pbr_from_base('oracle', rough_base=0.55, rough_var=0.22, relief=2.2, invert_h=True)
    # 龙袍（缂丝织物，粗纹理）
    pbr_from_base('dragon_robe', rough_base=0.66, rough_var=0.20, relief=2.4, invert_h=True)
    # 毛皮（毛发高粗糙 + 强起伏）
    pbr_from_base('fur_orange', rough_base=0.86, rough_var=0.16, relief=2.6, invert_h=True)
    pbr_from_base('fur_golden', rough_base=0.88, rough_var=0.15, relief=2.8, invert_h=True)
    pbr_from_base('fur_white', rough_base=0.90, rough_var=0.14, relief=2.8, invert_h=True)
    # 石质（颗粒/纹层，粗糙）
    pbr_from_base('petrified', rough_base=0.72, rough_var=0.20, relief=2.2, invert_h=True)
    pbr_from_base('basalt_base', rough_base=0.75, rough_var=0.18, relief=2.0, invert_h=True)
    pbr_from_base('rock_matrix', rough_base=0.78, rough_var=0.16, relief=1.8, invert_h=True)
    # 陨石（维斯台登纹微凸，金属质感偏光滑）
    pbr_from_base('meteorite_wid', rough_base=0.32, rough_var=0.16, relief=1.6, invert_h=True)
    # 银器（锤揲纹微凸，补 normal）
    normal_from_base('silver_base', relief=1.3, invert_h=True)

    print('ALL TEXTURES DONE')
