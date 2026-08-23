/**
 * natural.mjs — 自然历史馆真实展品还原
 */
import * as THREE from 'three';
import { M, box, cyl, sph, cone, torus, lathe, tube, extrude, ring, group, rng, loadTexture, boxWithFaces, cylWrap, makePatternTexture, furPattern, pandaPattern, monkeyPattern } from '../lib/kit.mjs';

const REF = '/refs/';

async function mamenchisaurus() {
  // 合川马门溪龙 Mamenchisaurus hochuanensis（正型 CCG V 20401）
  // 总长 22 m，颈长 9.3 m（占体长 45%），19 节颈椎，臀高 3.9 m
  // 椎式 19颈 + 12背 + 4荐 + 35尾；前后肢近等长，背线水平
  const g = new THREE.Group();
  const s = 1 / 22000;
  const u = (mm) => mm * s;

  const bone = M.bone();
  const darkBone = M.boneDark();

  const BACK = 3900;      // 背线（脊柱顶）高度 mm
  const SHZ = 4600;       // 肩带 z
  const HIPZ = 0;         // 髋 z

  // ── 背椎 12 节：肩→臀，水平背线 ──────────────────────
  const dLen = (SHZ - HIPZ) / 12;
  for (let i = 0; i < 12; i++) {
    const z = HIPZ + dLen * (i + 0.5);
    const r = 300 - Math.abs(i - 6) * 14;
    g.add(cyl(u(r), u(r), u(dLen * 0.9), bone, [0, u(BACK - 430), z * s], [Math.PI / 2, 0, 0]));
    g.add(box(u(80), u(600 - Math.abs(i - 6) * 34), u(dLen * 0.45), darkBone, [0, u(BACK - 120), z * s]));
    // 肋骨：桶状胸廓
    const spread = 1 - Math.abs(i - 5) / 9;
    for (const side of [-1, 1]) {
      g.add(tube(new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, u(BACK - 520), z * s),
        new THREE.Vector3(side * u(880 * spread), u(BACK - 1500), z * s),
        new THREE.Vector3(side * u(720 * spread), u(BACK - 2500), z * s),
        new THREE.Vector3(side * u(160 * spread), u(BACK - 3000), z * s),
      ]), u(52), bone, 16));
    }
  }

  // ── 颈椎 19 节：由肩向前上方缓升，颈肋叠瓦式 ────────────
  // C19(颈基) → C1(枕) 的椎体长度，峰值在中段
  const cerv = [325, 390, 470, 550, 620, 660, 690, 710, 730, 730, 710, 660, 580, 500, 415, 320, 215, 120, 60];
  let cz = SHZ, cy = BACK - 260, ang = 0.18;
  for (let i = 0; i < 19; i++) {
    const L = cerv[i];
    const r = 290 - i * 11;
    const dz = Math.cos(ang) * L, dy = Math.sin(ang) * L;
    const mz = cz + dz / 2, my = cy + dy / 2;
    const rot = [Math.PI / 2 - ang, 0, 0];

    g.add(cyl(u(r * 0.72), u(r), u(L * 0.94), bone, [0, u(my), u(mz)], rot));
    // 极长颈肋（马门溪龙标志特征，可跨 3-4 节）
    for (const side of [-1, 1]) {
      g.add(cyl(u(26), u(26), u(L * 2.2), darkBone,
        [side * u(r * 0.85), u(my - r * 0.55), u(mz)], rot));
    }
    // 低矮神经棘
    g.add(box(u(48), u(r * 0.55), u(L * 0.45), darkBone, [0, u(my + r * 0.82), u(mz)], [-ang, 0, 0]));

    cz += dz; cy += dy;
    ang = 0.18 + (i / 18) * 0.34;
  }

  // ── 头骨：小、低平、勺状齿 ───────────────────────────
  const skull = box(u(300), u(230), u(620), bone, [0, u(cy + 120), u(cz + 260)], [-0.35, 0, 0]);
  g.add(skull);
  g.add(box(u(240), u(90), u(300), darkBone, [0, u(cy + 30), u(cz + 520)], [-0.35, 0, 0]));

  // ── 荐椎 4 节 + 尾椎 35 节 ──────────────────────────
  for (let i = 0; i < 4; i++) {
    g.add(cyl(u(300), u(300), u(260), bone, [0, u(BACK - 430), u(-140 - i * 260)], [Math.PI / 2, 0, 0]));
  }
  let tz = -1180, ty = BACK - 450, tAng = 0.06;
  for (let i = 0; i < 35; i++) {
    const L = 320 - i * 6;
    const r = 250 - i * 6.2;
    const dz = -Math.cos(tAng) * L, dy = -Math.sin(tAng) * L;
    const mz = tz + dz / 2, my = ty + dy / 2;
    g.add(cyl(u(Math.max(r * 0.8, 12)), u(Math.max(r, 15)), u(L * 0.94), bone,
      [0, u(my), u(mz)], [Math.PI / 2 + tAng, 0, 0]));
    if (i < 18) g.add(box(u(40), u(r * 0.9), u(L * 0.4), darkBone, [0, u(my + r * 0.9), u(mz)], [tAng, 0, 0]));
    tz += dz; ty += dy;
    tAng = 0.06 + (i / 34) * 0.16;
  }

  // ── 四肢：前后肢近等长（比≈1.0）───────────────────────
  const limb = (z, x, upperR, upperL, lowerL) => {
    g.add(cyl(u(upperR * 0.8), u(upperR), u(upperL), bone, [x, u(lowerL + upperL / 2), z]));
    g.add(cyl(u(upperR * 0.62), u(upperR * 0.78), u(lowerL), bone, [x, u(lowerL / 2), z]));
    g.add(box(u(upperR * 2.1), u(160), u(upperR * 2.4), bone, [x, u(80), z + u(60)]));
  };
  for (const side of [-1, 1]) {
    // 前肢（肩带下）
    g.add(box(u(190), u(1100), u(420), bone, [side * u(980), u(BACK - 1000), u(SHZ - 300)], [0.25, 0, 0]));
    limb(u(SHZ - 420), side * u(1050), 200, 1500, 1300);
    // 后肢（髋下）
    g.add(box(u(210), u(1200), u(700), bone, [side * u(1000), u(BACK - 1050), u(-260)], [-0.12, 0, 0]));
    limb(u(-360), side * u(1120), 230, 1620, 1320);
  }

  return g;
}

async function mammoth() {
  // 真猛犸象 Mammuthus primigenius（Adams 标本形制）
  // 肩高 3.0 m，体长 4.5 m，象牙弧长 2.6 m（近 1.5 圈三维螺旋）
  // 单穹顶头骨、肩部脂肪隆起 + 背线向后急降、耳廓极小
  const g = new THREE.Group();
  const s = 1 / 6300;
  const u = (mm) => mm * s;
  const fur = M.mammothFur();
  const darkFur = M.mammothFurDark ? M.mammothFurDark() : M.mammothFur();
  const ivory = M.ivory();

  // ── 躯干：桶形，背线自肩向后急降 ────────────────────
  const body = new THREE.Mesh(new THREE.SphereGeometry(u(900), 32, 24), fur);
  body.scale.set(1.0, 1.02, 1.55);
  body.position.set(0, u(1780), u(-260));
  g.add(body);

  // 肩部脂肪隆起（猛犸最显著剪影特征）
  const hump = new THREE.Mesh(new THREE.SphereGeometry(u(640), 24, 18), fur);
  hump.scale.set(0.92, 0.86, 1.05);
  hump.position.set(0, u(2480), u(560));
  g.add(hump);
  // 臀部下压
  const rump = new THREE.Mesh(new THREE.SphereGeometry(u(720), 24, 18), fur);
  rump.scale.set(0.95, 0.82, 0.9);
  rump.position.set(0, u(1620), u(-1720));
  g.add(rump);

  // ── 头：高而短的单穹顶 ─────────────────────────────
  const head = new THREE.Mesh(new THREE.SphereGeometry(u(540), 28, 20), fur);
  head.scale.set(0.86, 1.12, 0.82);
  head.position.set(0, u(2420), u(1520));
  g.add(head);
  // 穹顶冠毛
  const dome = new THREE.Mesh(new THREE.SphereGeometry(u(360), 20, 14), darkFur);
  dome.scale.set(0.9, 0.78, 0.85);
  dome.position.set(0, u(2980), u(1440));
  g.add(dome);

  // ── 长鼻 ───────────────────────────────────────
  const trunk = tube(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, u(2180), u(1900)),
    new THREE.Vector3(0, u(1500), u(2180)),
    new THREE.Vector3(0, u(760), u(2080)),
    new THREE.Vector3(0, u(320), u(1760)),
    new THREE.Vector3(0, u(190), u(1980)),
  ]), u(180), fur, 40);
  g.add(trunk);

  // ── 象牙：向下外 → 外旋 → 内上回卷，近 1.5 圈三维螺旋 ──
  for (const side of [-1, 1]) {
    const pts = [];
    for (let t = 0; t <= 1.001; t += 0.035) {
      const turn = t * Math.PI * 1.45;                    // 1.45π ≈ 三维螺旋
      const rad = 300 + t * 640;                          // 螺旋半径外扩
      const x = side * (240 + Math.sin(turn) * rad * 0.72);
      const y = 2180 - Math.cos(turn) * rad * 1.15 - t * 120;
      const z = 1700 + t * 1400 - Math.sin(turn * 0.6) * 160;
      pts.push(new THREE.Vector3(u(x), u(y), u(z)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    // 根粗尖细
    const geo = new THREE.TubeGeometry(curve, 60, u(105), 12, false);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const t = Math.floor(i / 13) / 60;
      const k = 1 - t * 0.62;
      const c = curve.getPoint(Math.min(t, 1));
      pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * k, c.y + (pos.getY(i) - c.y) * k, c.z + (pos.getZ(i) - c.z) * k);
    }
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, ivory));
  }

  // ── 耳廓极小（约 30 cm，冻原适应）──────────────────
  for (const side of [-1, 1]) {
    const ear = box(u(60), u(300), u(230), fur, [side * u(430), u(2380), u(1300)], [0, side * 0.35, 0]);
    g.add(ear);
  }

  // ── 四肢：柱状 ─────────────────────────────────
  const leg = (x, z, r, h) => {
    g.add(cyl(u(r * 0.82), u(r), u(h), fur, [x, u(h / 2), z]));
    g.add(cyl(u(r * 1.05), u(r * 1.05), u(150), darkFur, [x, u(75), z]));
  };
  for (const side of [-1, 1]) {
    leg(side * u(600), u(880), 250, 1720);
    leg(side * u(580), u(-1320), 265, 1620);
  }

  // 短尾
  g.add(cyl(u(70), u(95), u(700), fur, [0, u(1720), u(-2340)], [0.5, 0, 0]));

  return g;
}

async function trilobite() {
  // Elrathia kingii：约 28mm，头甲1/3，胸13节，尾1/5
  const g = new THREE.Group();
  const s = 1 / 60;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'trilobite-0-texture.jpg', 'image/jpeg');
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, metalness: 0, side: THREE.DoubleSide });

  const slab = box(u(50), u(4), u(35), mat, [0, u(2), 0]);
  g.add(slab);

  // 三叶虫浮雕（简化）
  const shell = new THREE.Mesh(new THREE.SphereGeometry(u(12), 24, 12), new THREE.MeshStandardMaterial({ color: 0x3a2e22, roughness: 0.7 }));
  shell.scale.set(1, 0.3, 0.6);
  shell.position.set(0, u(5), 0);
  g.add(shell);

  return g;
}

async function fishFossil() {
  // Knightia eocaena：约120mm
  const g = new THREE.Group();
  const s = 1 / 200;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'fish-fossil-0-texture.jpg', 'image/jpeg');
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0 });

  const slab = box(u(220), u(8), u(140), mat, [0, u(4), 0]);
  g.add(slab);

  // 鱼形浮雕
  const shape = new THREE.Shape();
  shape.moveTo(-u(60), 0); shape.quadraticCurveTo(-u(20), u(25), u(40), u(15));
  shape.quadraticCurveTo(u(70), 0, u(40), -u(15)); shape.quadraticCurveTo(-u(20), -u(25), -u(60), 0);
  const fish = extrude(shape, u(1), new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.7 }));
  fish.position.y = u(8.2);
  g.add(fish);

  return g;
}

async function petrifiedWood() {
  // 硅化木切片：直径620，厚260
  const g = new THREE.Group();
  const s = 1 / 900;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'petrified-wood-0-texture.jpg', 'image/jpeg');
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.05 });
  const sideMat = M.rock();

  const r = u(310), h = u(260);
  const geo = new THREE.CylinderGeometry(r, r, h, 48);
  const mesh = new THREE.Mesh(geo, [sideMat, mat, sideMat]);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = h / 2;
  g.add(mesh);

  return g;
}

async function meteorite() {
  // 铁陨石切片：240×190×6
  const g = new THREE.Group();
  const s = 1 / 350;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'meteorite-0-texture.jpg', 'image/jpeg');
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.9 });

  const shape = new THREE.Shape();
  const r = u(120);
  shape.moveTo(-r, -r * 0.7); shape.lineTo(r, -r * 0.65); shape.lineTo(r * 0.9, r * 0.75); shape.lineTo(-r * 0.85, r * 0.8);
  const slice = extrude(shape, u(6), mat);
  slice.position.y = u(3);
  g.add(slice);

  return g;
}

async function basaltColumns() {
  // 柱状玄武岩：直径450，混合4-8边形
  const g = new THREE.Group();
  const s = 1 / 1200;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'basalt-columns-0-texture.jpg', 'image/jpeg');
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.02 });

  const cols = [
    { x: 0, z: 0, n: 6, h: u(1200) },
    { x: u(480), z: 0, n: 5, h: u(1100) },
    { x: u(240), z: u(420), n: 6, h: u(1000) },
    { x: u(-240), z: u(420), n: 7, h: u(1150) },
    { x: u(-480), z: 0, n: 6, h: u(1050) },
    { x: u(-240), z: u(-420), n: 4, h: u(900) },
    { x: u(240), z: u(-420), n: 8, h: u(950) },
  ];

  cols.forEach((c) => {
    const r = u(225);
    const col = cyl(r, r, c.h, mat, [c.x, c.h / 2, c.z], [0, 0, 0], c.n);
    g.add(col);
    // 球窝分节
    for (let y = c.h * 0.3; y < c.h * 0.9; y += c.h * 0.25) {
      g.add(torus(r * 0.95, u(8), mat, [c.x, y, c.z], [Math.PI / 2, 0, 0], c.n, 6));
    }
  });

  return g;
}

async function siberianTiger() {
  // 东北虎：头体长2100，尾950
  const g = new THREE.Group();
  const s = 1 / 3500;
  const u = (mm) => mm * s;

  const fur = furPattern('#c9822d', '#241c15', 1.0);
  const mat = new THREE.MeshStandardMaterial({ map: fur, roughness: 0.9, metalness: 0 });
  const white = M.furWhite();

  // 躯干
  const body = new THREE.Mesh(new THREE.SphereGeometry(u(450), 32, 24), mat);
  body.scale.set(1, 1.1, 2.2);
  body.position.set(0, u(600), 0);
  g.add(body);

  // 头
  const head = sph(u(220), mat, [0, u(820), u(650)]);
  g.add(head);
  // 白脸/耳
  g.add(sph(u(50), white, [u(120), u(880), u(620)]));
  g.add(sph(u(50), white, [-u(120), u(880), u(620)]));

  // 尾
  const tailPts = [];
  for (let t = 0; t <= 1; t += 0.05) {
    tailPts.push(new THREE.Vector3(Math.sin(t * Math.PI) * u(100), u(700) - t * u(300), u(-700) - t * u(900)));
  }
  g.add(tube(new THREE.CatmullRomCurve3(tailPts), u(30), mat, 32));

  // 腿
  const leg = (x, z) => {
    g.add(cyl(u(70), u(90), u(500), mat, [x, u(250), z]));
    g.add(cyl(u(60), u(70), u(60), white, [x, u(40), z]));
  };
  leg(u(180), u(450)); leg(-u(180), u(450)); leg(u(180), u(-500)); leg(-u(180), u(-500));

  return g;
}

async function giantPanda() {
  // 大熊猫：头体长1550，尾130
  const g = new THREE.Group();
  const s = 1 / 2200;
  const u = (mm) => mm * s;

  const fur = pandaPattern();
  const mat = new THREE.MeshStandardMaterial({ map: fur, roughness: 0.9, metalness: 0 });
  const white = M.furWhite();

  const body = new THREE.Mesh(new THREE.SphereGeometry(u(420), 32, 24), mat);
  body.scale.set(1, 1.05, 1.5);
  body.position.set(0, u(500), 0);
  g.add(body);

  // 头
  const head = sph(u(230), mat, [0, u(700), u(450)]);
  g.add(head);

  // 腿（黑）
  const leg = (x, z) => g.add(cyl(u(85), u(100), u(380), mat, [x, u(190), z]));
  leg(u(150), u(300)); leg(-u(150), u(300)); leg(u(150), u(-350)); leg(-u(150), u(-350));

  return g;
}

async function goldenMonkey() {
  // 川金丝猴：头体长680，尾660
  const g = new THREE.Group();
  const s = 1 / 1000;
  const u = (mm) => mm * s;

  const fur = monkeyPattern();
  const mat = new THREE.MeshStandardMaterial({ map: fur, roughness: 0.88, metalness: 0 });
  const blue = M.skinBlue();

  const body = new THREE.Mesh(new THREE.SphereGeometry(u(200), 32, 24), mat);
  body.scale.set(1, 1.1, 1.3);
  body.position.set(0, u(300), 0);
  g.add(body);

  // 头+蓝脸
  g.add(sph(u(110), mat, [0, u(450), u(160)]));
  const face = new THREE.Mesh(new THREE.SphereGeometry(u(70), 24, 16), blue);
  face.scale.set(1, 0.95, 0.7);
  face.position.set(0, u(440), u(210));
  g.add(face);

  // 尾
  const tailPts = [];
  for (let t = 0; t <= 1; t += 0.05) {
    tailPts.push(new THREE.Vector3(Math.sin(t * Math.PI * 2) * u(60), u(350) + t * u(200), u(-200) - t * u(500)));
  }
  g.add(tube(new THREE.CatmullRomCurve3(tailPts), u(25), mat, 32));

  // 四肢
  const limb = (x, z) => g.add(cyl(u(35), u(45), u(250), mat, [x, u(125), z]));
  limb(u(90), u(150)); limb(-u(90), u(150)); limb(u(90), u(-180)); limb(-u(90), u(-180));

  return g;
}

async function specimenJar() {
  // 浸制标本：罐直径170，高340
  const g = new THREE.Group();
  const s = 1 / 500;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'specimen-jar-1-texture.jpg', 'image/jpeg');
  const glass = M.glass();
  const liquid = M.liquid();

  const r = u(85), h = u(340);
  const jar = cyl(r, r, h, glass, [0, h / 2, 0]);
  g.add(jar);

  // 液体
  const liq = cyl(r * 0.92, r * 0.92, h * 0.75, liquid, [0, h * 0.375, 0]);
  g.add(liq);

  // 标本（贴图平片）
  const specimenMat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  g.add(box(r * 1.4, h * 0.4, u(4), specimenMat, [0, h * 0.45, 0]));

  // 盖
  g.add(cyl(r * 1.05, r * 1.05, u(20), glass, [0, h + u(10), 0]));

  return g;
}

async function insectCase() {
  // 蝴蝶与甲虫标本柜
  const g = new THREE.Group();
  const s = 1 / 650;
  const u = (mm) => mm * s;

  const tex = await loadTexture(REF + 'insect-case-1-texture.jpg', 'image/jpeg');
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0 });
  const wood = M.wood();

  const w = u(482), d = u(419), h = u(76);
  // 抽屉盒
  g.add(box(w, h, d, wood, [0, h / 2, 0]));
  // 顶面玻璃/标本贴图
  g.add(box(w * 0.94, u(4), d * 0.94, mat, [0, h + u(2), 0]));

  return g;
}

export const NATURAL = {
  'mamenchisaurus': mamenchisaurus,
  'mammoth': mammoth,
  'trilobite-fossil': trilobite,
  'fish-fossil': fishFossil,
  'petrified-wood': petrifiedWood,
  'meteorite': meteorite,
  'basalt-columns': basaltColumns,
  'siberian-tiger': siberianTiger,
  'giant-panda': giantPanda,
  'golden-monkey': goldenMonkey,
  'specimen-jar': specimenJar,
  'insect-case': insectCase,
};
