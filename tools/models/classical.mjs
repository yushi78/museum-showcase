/**
 * classical.mjs — 古典展馆真实展品还原
 * 全部按 manifest 中的真实尺寸与形制重建，并使用公开授权照片纹理。
 */
import * as THREE from 'three';
import { M, box, cyl, sph, cone, torus, lathe, tube, extrude, ring, group, rng, loadTexture, boxWithFaces, cylWrap, makePatternTexture } from '../lib/kit.mjs';

const REF = '/refs/';

async function fangDing() {
  // 后母戊鼎：通高1330，口长1120，口宽790，器身高870，足高460
  const g = new THREE.Group();
  const s = 1 / 1330; // 以 mm 为单位的缩放：整体归一化到约 1.3m 高
  const u = (mm) => mm * s;

  const bodyMat = M.bronzePatina();
  const legMat = M.bronzeDark();
  const rimMat = M.bronzeWorn();

  // 器身长方槽
  const bodyW = u(1120), bodyH = u(870), bodyD = u(790);
  const body = box(bodyW, bodyH, bodyD, bodyMat, [0, u(460) + bodyH / 2, 0]);
  g.add(body);

  // 四柱足
  const legH = u(460), legW = u(180), legD = u(180);
  const legPos = [
    [u(350), legH / 2, u(240)], [u(-350), legH / 2, u(240)],
    [u(350), legH / 2, u(-240)], [u(-350), legH / 2, u(-240)],
  ];
  legPos.forEach((p) => g.add(box(legW, legH, legD, legMat, p)));

  // 口沿
  g.add(box(u(1180), u(40), u(850), rimMat, [0, u(460) + bodyH + u(20), 0]));

  // 立耳
  g.add(box(u(140), u(160), u(40), legMat, [u(420), u(460) + bodyH + u(110), 0]));
  g.add(box(u(140), u(160), u(40), legMat, [u(-420), u(460) + bodyH + u(110), 0]));

  // 扉棱
  const ribMat = M.bronzeDark();
  for (let x of [-bodyW / 2, 0, bodyW / 2]) {
    g.add(box(u(16), bodyH, u(12), ribMat, [x, u(460) + bodyH / 2, bodyD / 2 + u(6)]));
    g.add(box(u(16), bodyH, u(12), ribMat, [x, u(460) + bodyH / 2, -bodyD / 2 - u(6)]));
  }
  for (let z of [-bodyD / 2, 0, bodyD / 2]) {
    g.add(box(u(12), bodyH, u(16), ribMat, [bodyW / 2 + u(6), u(460) + bodyH / 2, z]));
    g.add(box(u(12), bodyH, u(16), ribMat, [-bodyW / 2 - u(6), u(460) + bodyH / 2, z]));
  }

  // 尝试加载正面纹理
  try {
    const tex = await loadTexture(REF + 'fang-ding-0-texture.jpg', 'image/jpeg');
    const frontMat = bodyMat.clone(); frontMat.map = tex; frontMat.color.setHex(0xffffff);
    const backMat = bodyMat.clone(); backMat.map = tex; backMat.color.setHex(0xffffff);
    const sideMat = bodyMat;
    // BoxGeometry 材质索引：0:+x 1:-x 2:+y 3:-y 4:+z 5:-z
    body.material = [sideMat, sideMat, rimMat, rimMat, frontMat, backMat];
    // 调整 UV 让正面图覆盖 +z/-z 面
    const uv = body.geometry.attributes.uv;
    // +z 面 (index 20-23) 和 -z 面 (index 16-19) — 简单缩放
    for (let i = 0; i < uv.count; i++) {
      const uu = uv.getX(i), vv = uv.getY(i);
      // 给所有面统一映射
      uv.setXY(i, uu * 0.6 + 0.2, vv * 0.6 + 0.2);
    }
  } catch {}

  return g;
}

async function bianzhong() {
  // 曾侯乙编钟：曲尺形三层八组，最大钟高1534，钟架长边7480
  const g = new THREE.Group();
  const s = 1 / 7480;
  const u = (mm) => mm * s;

  const frameMat = M.wood();
  const bronze = M.bronzePatina();

  // 简化：L 形木架
  const beamLong = u(7480), beamShort = u(3350), beamH = u(260);
  g.add(box(beamLong, beamH, u(220), frameMat, [u(1870), u(2500), u(-1675)]));
  g.add(box(u(220), beamH, beamShort, frameMat, [u(3740), u(2500), 0]));

  // 立柱
  const posts = [[0, 0], [beamLong, 0], [beamLong, beamShort], [0, beamShort]];
  posts.forEach(([x, z]) => g.add(box(u(200), u(2650), u(200), frameMat, [x, u(1325), z])));

  // 铜人承托柱（简化）
  for (let x of [u(1200), u(4500)]) {
    const figure = group('', box(u(180), u(500), u(120), bronze, [x, u(250), u(-1675 - u(80))]));
    g.add(figure);
  }

  // 钟：合瓦形，简化用圆柱/锥
  const bellSizes = [0.18, 0.14, 0.10, 0.07];
  const rows = [u(2300), u(1900), u(1500), u(1100)];
  rows.forEach((y, row) => {
    const size = bellSizes[row] || 0.06;
    const count = row === 0 ? 6 : row === 1 ? 8 : row === 2 ? 10 : 12;
    for (let i = 0; i < count; i++) {
      const x = u(500) + i * (beamLong - u(1000)) / (count - 1);
      const z = u(-1400) + (i % 2) * u(400);
      const bell = lathe([[size * 0.25, 0], [size * 0.35, size * 0.6], [size * 0.2, size]], bronze);
      bell.position.set(x, y, z);
      bell.rotation.x = Math.PI;
      g.add(bell);
      // 挂钮
      g.add(box(size * 0.08, size * 0.15, size * 0.04, bronze, [x, y + size * 0.4, z]));
    }
  });

  return g;
}

async function jadeCong() {
  // 良渚玉琮王：高89，射径174/170，孔径50/38
  const g = new THREE.Group();
  const s = 1 / 200; // 展品级大小
  const u = (mm) => mm * s;
  const h = u(89), topD = u(174), botD = u(170);

  // 外方内圆：用四个竖板拼成方筒
  const wallMat = M.jadeGreen();
  const sideW = topD, sideH = h, sideT = (topD - u(50)) / 2;
  g.add(box(sideW, sideH, sideT, wallMat, [0, h / 2, (topD - sideT) / 2]));
  g.add(box(sideW, sideH, sideT, wallMat, [0, h / 2, -(topD - sideT) / 2]));
  g.add(box(sideT, sideH, topD - sideT * 2, wallMat, [(topD - sideT) / 2, h / 2, 0]));
  g.add(box(sideT, sideH, topD - sideT * 2, wallMat, [-(topD - sideT) / 2, h / 2, 0]));

  // 上下射口圆管
  g.add(cyl(u(85), u(85), h * 0.12, wallMat, [0, h * 0.06, 0]));
  g.add(cyl(u(82), u(82), h * 0.12, wallMat, [0, h * 0.94, 0]));

  try {
    const tex = await loadTexture(REF + 'jade-cong-0-texture.jpg', 'image/jpeg');
    const faceMat = wallMat.clone(); faceMat.map = tex; faceMat.color.setHex(0xffffff);
    // 把四个外侧面换成贴图
    g.children.slice(0, 4).forEach((child) => { child.material = faceMat; });
  } catch {}

  return g;
}

async function oracleBone() {
  // 商代牛肩胛骨：约 260×130×6 mm，贴真实甲骨照片
  const g = new THREE.Group();
  const s = 1 / 300;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'oracle-bone-0-texture.jpg', 'image/jpeg');
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88, metalness: 0 });

  // 肩胛骨不对称扇形：骨臼端（下）厚圆，骨扇端（上）薄阔，切去骨脊。
  // 按馆藏惯例竖立展示 —— 长 260 mm 沿 Y 轴。
  const shape = new THREE.Shape();
  shape.moveTo(-u(22), 0);                                        // 骨臼端
  shape.quadraticCurveTo(u(30), -u(8), u(46), u(26));
  shape.quadraticCurveTo(u(58), u(120), u(64), u(196));            // 右缘微鼓
  shape.quadraticCurveTo(u(62), u(248), u(16), u(260));            // 骨扇端上缘
  shape.quadraticCurveTo(-u(40), u(258), -u(62), u(220));
  shape.quadraticCurveTo(-u(54), u(120), -u(40), u(40));           // 左缘（切去骨脊后的直缘）
  shape.quadraticCurveTo(-u(38), u(10), -u(22), 0);
  const mesh = extrude(shape, u(6), mat);
  g.add(mesh);

  // 背面枣核形长凿 + 旁侧圆钻
  const drill = M.boneDark ? M.boneDark() : mat;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 2; c++) {
      const x = (c === 0 ? -u(24) : u(22)) + (r % 2) * u(5);
      const y = u(52 + r * 42);
      const chisel = new THREE.Mesh(new THREE.SphereGeometry(u(7), 10, 8), drill);
      chisel.scale.set(0.42, 1.5, 0.5);
      chisel.position.set(x, y, -u(0.5));
      g.add(chisel);
      g.add(cyl(u(4.5), u(4.5), u(3), drill, [x + u(11), y - u(4), -u(0.5)], [Math.PI / 2, 0, 0], 10));
    }
  }

  return g;
}

async function greekAmphora() {
  // 泛雅典娜奖瓶：高705，口径229，足径140
  const g = new THREE.Group();
  const s = 1 / 900;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'greek-amphora-0-texture.png', 'image/png');
  const bodyMat = M.terracotta().clone();
  bodyMat.map = tex; bodyMat.color.setHex(0xffffff); bodyMat.roughness = 0.55;

  // 轮廓点 [r, y] 从底到口
  const profile = [
    [u(70), 0], [u(100), u(40)], [u(142), u(250)], [u(140), u(420)],
    [u(110), u(600)], [u(90), u(660)], [u(114), u(705)],
  ];
  const body = lathe(profile, bodyMat, 64);
  body.position.y = 0;
  g.add(body);

  // 双耳
  const handleMat = M.blackGlaze();
  const handle = torus(u(70), u(10), handleMat, [u(130), u(500), 0], [0, 0, 0], 24, 12);
  handle.scale.set(1, 1.6, 1);
  g.add(handle);
  const handle2 = handle.clone(); handle2.position.x = -u(130); g.add(handle2);

  // 口沿黑釉
  g.add(cyl(u(114), u(114), u(30), handleMat, [0, u(690), 0]));
  // 足底
  g.add(cyl(u(70), u(70), u(25), handleMat, [0, u(12), 0]));

  return g;
}

async function yuanBlueVase() {
  // 元青花梅瓶：高441，口径55，底径130，最大腹径284
  const g = new THREE.Group();
  const s = 1 / 600;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'yuan-blue-vase-0-texture.jpg', 'image/jpeg');
  const bodyMat = M.porcelain().clone();
  bodyMat.map = tex; bodyMat.color.setHex(0xffffff); bodyMat.roughness = 0.12; bodyMat.metalness = 0.02;

  const profile = [
    [u(65), 0], [u(90), u(40)], [u(142), u(180)], [u(130), u(300)], [u(55), u(400)], [u(40), u(430)], [u(27), u(441)],
  ];
  const body = lathe(profile, bodyMat, 64);
  g.add(body);
  return g;
}

async function chickenCup() {
  // 明成化斗彩鸡缸杯：高41，口径83，足径38
  const g = new THREE.Group();
  const s = 1 / 150;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'chicken-cup-0-texture.jpg', 'image/jpeg');
  const mat = M.porcelain().clone();
  mat.map = tex; mat.color.setHex(0xffffff); mat.roughness = 0.12;

  const profile = [
    [u(19), 0], [u(30), u(5)], [u(41), u(25)], [u(41), u(41)], [u(38), u(41)],
  ];
  const body = lathe(profile, mat, 48);
  g.add(body);
  return g;
}

async function silverEwer() {
  // 鎏金鹦鹉纹提梁银罐：高242，口径124，足径143
  const g = new THREE.Group();
  const s = 1 / 350;
  const u = (mm) => mm * s;

  const silver = M.silver();
  const gold = M.gold();

  // 器身：喇叭形圈足 → 圆鼓腹（最大径 185）→ 短直颈（口径 124）
  const profile = [
    [u(30), 0], [u(71), u(4)], [u(71), u(14)], [u(52), u(30)],
    [u(66), u(58)], [u(86), u(108)], [u(92), u(150)], [u(84), u(196)],
    [u(66), u(228)], [u(62), u(242)], [u(66), u(248)],
  ];
  g.add(lathe(profile, silver, 56));

  // 覆碗形盖 + 宝珠钮
  g.add(lathe([[u(4), u(276)], [u(34), u(272)], [u(56), u(262)], [u(65), u(250)], [u(65), u(246)]], gold, 40));
  g.add(sph(u(11), gold, [0, u(284), 0]));

  // 弧形提梁：半环，两端接肩部双系
  const arc = new THREE.Mesh(new THREE.TorusGeometry(u(78), u(6), 10, 40, Math.PI), gold);
  arc.position.set(0, u(212), 0);
  arc.scale.set(1, 0.62, 1);
  g.add(arc);
  for (const side of [-1, 1]) {
    g.add(torus(u(11), u(3.5), gold, [side * u(78), u(206), 0], [0, Math.PI / 2, 0], 14, 8)); // 双系
  }

  // 腹部两侧鹦鹉展翅团花（鎏金錾刻，以浅浮雕环示意）
  for (const side of [-1, 1]) {
    g.add(torus(u(38), u(2.4), gold, [0, u(140), side * u(84)], [0, side > 0 ? 0 : Math.PI, 0], 28, 6));
    const bird = group('',
      sph(u(9), gold, [0, u(6), 0]),
      box(u(26), u(3), u(9), gold, [u(3), 0, 0], [0, 0, 0.35]),
      box(u(26), u(3), u(9), gold, [-u(3), 0, 0], [0, 0, -0.35]),
      cyl(u(2), u(4), u(20), gold, [0, -u(14), 0], [0.3, 0, 0]),
    );
    bird.position.set(0, u(140), side * u(86));
    bird.rotation.y = side > 0 ? 0 : Math.PI;
    g.add(bird);
  }
  // 盖面宝相花
  g.add(torus(u(30), u(2.2), gold, [0, u(268), 0], [Math.PI / 2, 0, 0], 24, 6));

  return g;
}

async function jadeImperialSeal() {
  // 皇后之玺：20×28×28 mm，螭虎钮
  const g = new THREE.Group();
  const s = 1 / 60;
  const u = (mm) => mm * s;

  const jade = M.jadeWhite();
  const tex = await loadTexture(REF + 'jade-imperial-seal-0-texture.jpg', 'image/jpeg');
  const topMat = jade.clone(); topMat.map = tex; topMat.color.setHex(0xffffff);

  const base = box(u(28), u(8), u(28), jade, [0, u(4), 0]);
  base.material = [jade, jade, topMat, jade, jade, jade]; // +y 面为顶面贴印文
  g.add(base);

  // 螭虎钮简化
  const body = box(u(14), u(10), u(22), jade, [0, u(13), 0]);
  g.add(body);
  g.add(sph(u(5), jade, [0, u(19), u(9)])); // 头
  // 尾
  const tail = tube(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, u(14), -u(10)),
    new THREE.Vector3(u(8), u(16), -u(14)),
    new THREE.Vector3(u(12), u(14), -u(6)),
  ]), u(2), jade);
  g.add(tail);

  return g;
}

async function dragonRobe() {
  // 清代龙袍：衣长1448，通袖2159
  const g = new THREE.Group();
  const s = 1 / 1800;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'dragon-robe-0-texture.jpg', 'image/jpeg');
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.2, 1.5);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.12, side: THREE.DoubleSide });

  // 躯干：梯形截面长袍
  const shape = new THREE.Shape();
  shape.moveTo(-u(350), 0);
  shape.lineTo(u(350), 0);
  shape.lineTo(u(380), u(1448));
  shape.lineTo(-u(380), u(1448));
  shape.lineTo(-u(350), 0);
  const robe = extrude(shape, u(60), mat);
  robe.position.z = -u(30);
  g.add(robe);

  // 袖子
  const sleeveShape = new THREE.Shape();
  sleeveShape.moveTo(0, 0); sleeveShape.lineTo(u(680), u(100)); sleeveShape.lineTo(u(720), u(220)); sleeveShape.lineTo(u(80), u(160)); sleeveShape.lineTo(0, 0);
  const sleeveL = extrude(sleeveShape, u(50), mat);
  sleeveL.position.set(-u(350), u(1250), -u(25));
  sleeveL.rotation.z = -0.08;
  g.add(sleeveL);
  const sleeveR = sleeveL.clone();
  sleeveR.scale.x = -1; sleeveR.position.x = u(350);
  g.add(sleeveR);

  // 领口
  g.add(box(u(180), u(40), u(70), mat, [0, u(1448), 0]));

  return g;
}

async function phoenixCrown() {
  // 孝端皇后九龙九凤冠：通高485，冠径237
  const g = new THREE.Group();
  const s = 1 / 650;
  const u = (mm) => mm * s;

  const gold = M.gold();
  const blue = M.kingfisher();
  const red = M.silkRed();

  const rnd = rng(20250802);

  // ── 冠胎：髹漆细竹丝编圆框，外覆罗、点翠为地（冠高 270，冠径 237）──
  const crown = new THREE.Mesh(new THREE.SphereGeometry(u(118), 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), blue);
  crown.scale.set(1, 1.14, 1);
  crown.position.y = u(126);
  g.add(crown);
  // 冠口金圈
  g.add(torus(u(118), u(7), gold, [0, u(126), 0], [Math.PI / 2, 0, 0], 40, 8));
  // 竹丝编织纹
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    g.add(box(u(3), u(150), u(3), gold, [Math.cos(a) * u(112), u(196), Math.sin(a) * u(112)]));
  }

  // ── 九金龙：顶部正中一条大升龙，两侧各四条行龙 ────────────
  const makeDragon = (scale) => group('',
    cyl(u(7 * scale), u(9 * scale), u(46 * scale), gold, [0, 0, 0], [0.5, 0, 0]),         // 躯
    sph(u(10 * scale), gold, [0, u(26 * scale), u(11 * scale)]),                            // 首
    box(u(6 * scale), u(4 * scale), u(20 * scale), gold, [0, u(32 * scale), u(20 * scale)]),// 吻
    box(u(3 * scale), u(14 * scale), u(3 * scale), gold, [u(6 * scale), u(36 * scale), u(6 * scale)], [0, 0, 0.4]), // 角
    box(u(3 * scale), u(14 * scale), u(3 * scale), gold, [-u(6 * scale), u(36 * scale), u(6 * scale)], [0, 0, -0.4]),
    cyl(u(2 * scale), u(3 * scale), u(34 * scale), gold, [0, -u(26 * scale), -u(8 * scale)], [-0.6, 0, 0]), // 尾
    torus(u(9 * scale), u(2 * scale), gold, [u(11 * scale), u(4 * scale), 0], [0, Math.PI / 2, 0], 12, 6),   // 爪
    torus(u(9 * scale), u(2 * scale), gold, [-u(11 * scale), u(4 * scale), 0], [0, Math.PI / 2, 0], 12, 6),
  );

  // 顶部大升龙 + 口衔宝珠滴
  const top = makeDragon(1.6);
  top.position.set(0, u(320), u(10));
  top.rotation.x = -0.15;
  g.add(top);
  g.add(sph(u(15), red, [0, u(408), u(38)]));
  g.add(sph(u(8), gold, [0, u(432), u(30)]));

  // 两侧各四条行龙（环绕冠体上部）
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const a = side * (0.42 + i * 0.52);
      const d = makeDragon(1.0);
      d.position.set(Math.sin(a) * u(104), u(214 - i * 12), Math.cos(a) * u(104));
      d.rotation.y = a;
      g.add(d);
      // 龙口衔珠宝滴
      g.add(sph(u(6), red, [Math.sin(a) * u(126), u(238 - i * 12), Math.cos(a) * u(126)]));
    }
  }

  // ── 九翠凤：龙下方八只对称排列 + 冠后正中一只 ──────────────
  const makePhoenix = () => group('',
    sph(u(9), blue, [0, 0, 0]),
    box(u(30), u(4), u(11), blue, [u(14), u(3), 0], [0, 0, 0.28]),
    box(u(30), u(4), u(11), blue, [-u(14), u(3), 0], [0, 0, -0.28]),
    sph(u(5), blue, [0, u(11), u(7)]),
    cyl(u(1.6), u(3), u(40), blue, [0, -u(16), -u(12)], [-0.7, 0, 0]),
    sph(u(3), gold, [0, -u(34), -u(24)]),
  );
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const a = side * (0.30 + i * 0.56);
      const p = makePhoenix();
      p.position.set(Math.sin(a) * u(110), u(148 - i * 8), Math.cos(a) * u(110));
      p.rotation.y = a;
      g.add(p);
    }
  }
  const back = makePhoenix();
  back.position.set(0, u(160), -u(112));
  back.rotation.y = Math.PI;
  g.add(back);

  // ── 冠后左右各出三扇博鬓，共六扇 ──────────────────────
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const b = box(u(64), u(112), u(4), blue);
      b.position.set(side * u(158), u(96) - i * u(26), -u(74) - i * u(16));
      b.rotation.set(0, side * (0.24 + i * 0.1), side * 0.12);
      g.add(b);
      g.add(box(u(66), u(6), u(5), gold, [side * u(158), u(150) - i * u(26), -u(74) - i * u(16)],
        [0, side * (0.24 + i * 0.1), side * 0.12]));
      // 珠串垂饰
      for (let j = 0; j < 5; j++) {
        g.add(sph(u(3.4), j % 2 ? red : gold,
          [side * u(186 - j * 2), u(34) - i * u(26) - j * u(9), -u(78) - i * u(16)]));
      }
    }
  }

  // ── 红蓝宝石 115 块、珍珠 4414 颗（示意性抽样点缀）────────
  for (let i = 0; i < 90; i++) {
    const a = rnd() * Math.PI * 2;
    const yy = 132 + rnd() * 148;
    const r = u(118) * Math.sqrt(Math.max(0.05, 1 - Math.pow((yy - 126) / 168, 2)));
    g.add(sph(u(3 + rnd() * 3.4), rnd() > 0.45 ? red : gold, [Math.cos(a) * r, u(yy), Math.sin(a) * r]));
  }

  return g;
}

export const CLASSICAL = {
  'bronze-fangding': fangDing,
  'bianzhong': bianzhong,
  'jade-cong': jadeCong,
  'oracle-bone': oracleBone,
  'greek-amphora': greekAmphora,
  'yuan-blue-vase': yuanBlueVase,
  'chenghua-chicken-cup': chickenCup,
  'tang-silver-ewer': silverEwer,
  'jade-imperial-seal': jadeImperialSeal,
  'dragon-robe': dragonRobe,
  'phoenix-crown': phoenixCrown,
};
