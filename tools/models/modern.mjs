/**
 * modern.mjs — 现代展馆真实展品还原（按公开规格比例）
 */
import * as THREE from 'three';
import { M, box, cyl, sph, cone, torus, lathe, tube, extrude, ring, group, rng, loadTexture, boxWithFaces, cylWrap, makePatternTexture } from '../lib/kit.mjs';

const REF = '/refs/';

async function conceptCar() {
  // Mercedes-Benz VISION EQXX：长4975 宽1870 高1348 轴距2800
  const g = new THREE.Group();
  const s = 1 / 5600;
  const u = (mm) => mm * s;
  const paint = M.carPaint(0xdce0e5);
  const black = M.carbon();
  const glass = new THREE.MeshStandardMaterial({ color: 0x1a1d22, metalness: 0.6, roughness: 0.1 });

  // 单弓形(one-bow) 剪影：车顶自 A 柱连续下滑至尾部收成水滴尾(boat-tail)
  // 车头在 +X，车尾在 −X；车宽沿 Z
  const SEG = 22;
  const bodyPts = [];
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;                       // 0=车尾 1=车头
    const x = -2487 + t * 4975;
    // 车顶轮廓：单弓形，最高点在轴距中后段
    const roof = 1348 * (0.30 + 0.70 * Math.sin(Math.pow(t, 0.86) * Math.PI * 0.98));
    // 平面收窄：车尾明显比车头窄（boat-tail）
    const halfW = 935 * (0.52 + 0.48 * Math.sin(Math.min(1, t * 1.22) * Math.PI * 0.9)) * (0.72 + 0.28 * t);
    bodyPts.push({ x, roof: Math.max(roof, 300), halfW: Math.max(halfW, 300) });
  }
  for (let i = 0; i < SEG; i++) {
    const a = bodyPts[i], b = bodyPts[i + 1];
    const cx = (a.x + b.x) / 2, len = b.x - a.x;
    const w = (a.halfW + b.halfW);
    const h = (a.roof + b.roof) / 2;
    // 下半车身（漆面）
    g.add(box(u(len * 1.02), u(Math.min(h, 720)), u(w), paint, [u(cx), u(Math.min(h, 720) / 2 + 60), 0]));
    // 上半座舱（玻璃穹顶）
    if (h > 720) {
      const gh = h - 720;
      g.add(box(u(len * 1.02), u(gh), u(w * 0.88), glass, [u(cx), u(720 + gh / 2 + 60), 0]));
    }
  }

  // 车顶 117 块太阳能板
  for (let i = 0; i < 9; i++) {
    for (let k = 0; k < 4; k++) {
      g.add(box(u(190), u(8), u(150), M.solarPanel ? M.solarPanel() : black,
        [u(-1150 + i * 210), u(1320), u(-270 + k * 180)]));
    }
  }

  // 前脸：无格栅，封闭盾形黑面板 + 环状灯带
  g.add(box(u(60), u(400), u(1420), black, [u(2455), u(420), 0]));
  g.add(box(u(26), u(46), u(1300), M.techCyan(), [u(2478), u(560), 0]));
  g.add(box(u(26), u(40), u(1180), M.techCyan(), [u(-2470), u(600), 0]));

  // 轮拱：后轮完全被半包轮眉覆盖
  for (const z of [1, -1]) {
    g.add(box(u(1180), u(300), u(70), black, [u(-1400), u(430), z * u(880)]));   // 后轮眉包板
    g.add(box(u(820), u(210), u(66), black, [u(1400), u(470), z * u(900)]));      // 前轮眉
  }

  // 车轮：185/65 R20 超窄胎，轮径 750
  for (const x of [u(1400), -u(1400)]) {
    for (const z of [u(845), -u(845)]) {
      g.add(torus(u(288), u(88), black, [x, u(375), z], [0, 0, Math.PI / 2], 26, 12));
      g.add(cyl(u(232), u(232), u(150), M.polishedAlu ? M.polishedAlu() : paint,
        [x, u(375), z], [Math.PI / 2, 0, 0], 26));
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        g.add(box(u(30), u(150), u(160), black,
          [x + Math.cos(a) * u(150), u(375) + Math.sin(a) * u(150), z], [0, 0, a]));
      }
    }
  }

  // 后视摄像头替代物理后视镜
  for (const z of [1, -1]) {
    g.add(box(u(120), u(40), u(50), black, [u(900), u(1010), z * u(830)]));
  }

  return g;
}

async function evtol() {
  // EHang EH216-S：5630×5630×1855，16桨共轴双桨
  const g = new THREE.Group();
  const s = 1 / 7000;
  const u = (mm) => mm * s;

  const white = M.whitePoly();
  const carbon = M.carbon();
  const glass = new THREE.MeshStandardMaterial({ color: 0x22262c, metalness: 0.5, roughness: 0.1 });

  // 座舱胶囊
  const cabin = new THREE.Mesh(new THREE.CapsuleGeometry(u(600), u(1200), 8, 24), white);
  cabin.rotation.z = Math.PI / 2;
  cabin.position.set(0, u(650), 0);
  g.add(cabin);

  // 鸥翼门缝
  g.add(box(u(10), u(900), u(20), carbon, [0, u(700), u(600)]));

  // 8 臂
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const armLen = u(2500);
    const arm = box(armLen, u(40), u(60), carbon, [Math.cos(a) * armLen / 2, u(720), Math.sin(a) * armLen / 2], [0, -a, 0]);
    g.add(arm);

    // 上下双桨
    const px = Math.cos(a) * armLen, pz = Math.sin(a) * armLen;
    for (let y of [u(760), u(820)]) {
      const prop = new THREE.Mesh(new THREE.RingGeometry(u(50), u(350), 24), new THREE.MeshStandardMaterial({ color: 0x111, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
      prop.position.set(px, y, pz);
      prop.rotation.x = Math.PI / 2;
      g.add(prop);
    }
  }

  // 橇式起落架
  for (let z of [u(400), -u(400)]) {
    const ski = box(u(1400), u(30), u(40), carbon, [0, u(120), z]);
    g.add(ski);
    g.add(cyl(u(25), u(25), u(520), carbon, [u(600), u(350), z], [0, 0, 0]));
    g.add(cyl(u(25), u(25), u(520), carbon, [-u(600), u(350), z], [0, 0, 0]));
  }

  return g;
}

async function smartWatch() {
  // Apple Watch Ultra 2 形制：49×44×14.4 mm
  const g = new THREE.Group();
  const s = 1 / 80;
  const u = (mm) => mm * s;

  const ti = M.titanium();
  const orange = M.orangeBtn();
  const black = M.carbon();

  // 表壳
  const case_ = new THREE.Mesh(new THREE.BoxGeometry(u(44), u(49), u(14.4), 4, 4, 2), ti);
  case_.geometry = new THREE.CylinderGeometry(u(28), u(28), u(49), 32);
  case_.rotation.z = Math.PI / 2;
  case_.position.y = u(24.5);
  g.add(case_);

  // 屏幕
  g.add(cyl(u(24), u(24), u(2), black, [0, u(25), u(6)], [Math.PI / 2, 0, 0], 32));

  // 表冠
  g.add(cyl(u(5), u(5), u(8), ti, [0, u(40), u(10)], [Math.PI / 2, 0, 0], 16));
  // 橙色按钮
  g.add(box(u(4), u(12), u(4), orange, [0, u(25), u(10)]));

  // 表带
  g.add(box(u(28), u(120), u(4), orange, [0, u(95), 0]));
  g.add(box(u(28), u(120), u(4), orange, [0, u(-45), 0]));

  return g;
}

async function arGlasses() {
  // HoloLens 2 形制：visor ~190×62，头箍
  const g = new THREE.Group();
  const s = 1 / 300;
  const u = (mm) => mm * s;

  const shell = M.holoLens();
  const visor = M.visor();

  // 面罩
  const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(u(190), u(62), u(40), 8, 4, 2), visor);
  visorMesh.position.set(0, u(40), u(60));
  g.add(visorMesh);

  // 头箍环
  const band = torus(u(95), u(18), shell, [0, u(90), 0], [Math.PI / 2, 0, 0], 48, 12);
  band.scale.set(1, 0.7, 1);
  g.add(band);

  // 后脑电池仓
  g.add(box(u(80), u(50), u(35), shell, [0, u(95), u(-100)]));

  // 相机
  for (let x of [u(60), -u(60), u(30), -u(30)]) {
    g.add(sph(u(5), M.carbon(), [x, u(55), u(80)]));
  }

  return g;
}

async function humanoidRobot() {
  // Unitree G1：高1320，宽450，厚200
  const g = new THREE.Group();
  const s = 1 / 1800;
  const u = (mm) => mm * s;

  const white = M.whitePoly();
  const black = M.carbon();
  const steel = M.steel();

  // 头
  g.add(box(u(120), u(90), u(110), white, [0, u(1200), 0]));
  // 激光雷达
  g.add(cyl(u(35), u(35), u(25), black, [0, u(1270), 0]));

  // 躯干
  g.add(box(u(220), u(260), u(130), white, [0, u(1000), 0]));

  // 肩/髋关节
  const joint = (x, y) => cyl(u(40), u(40), u(60), black, [x, y, 0], [0, 0, Math.PI / 2]);
  g.add(joint(u(140), u(1080))); g.add(joint(-u(140), u(1080)));
  g.add(joint(u(90), u(680))); g.add(joint(-u(90), u(680)));

  // 手臂
  const arm = (x) => {
    g.add(cyl(u(28), u(28), u(320), white, [x, u(920), 0]));
    g.add(cyl(u(25), u(25), u(280), white, [x, u(620), 0]));
    g.add(box(u(40), u(60), u(20), steel, [x, u(470), 0]));
  };
  arm(u(160)); arm(-u(160));

  // 腿
  const leg = (x) => {
    g.add(cyl(u(35), u(40), u(360), white, [x, u(500), 0]));
    g.add(cyl(u(28), u(32), u(360), white, [x, u(180), 0]));
    g.add(box(u(50), u(30), u(120), black, [x, u(15), u(30)]));
  };
  leg(u(90)); leg(-u(90));

  return g;
}

async function robotDog() {
  // Unitree Go2：700×310×400
  const g = new THREE.Group();
  const s = 1 / 1000;
  const u = (mm) => mm * s;

  const black = M.carbon();
  const grey = M.steel();
  const light = M.techCyan();

  // 机身沿 +Z 为前进方向：长 700 × 宽 310 × 高 400
  // 躯干：扁长方体，上表面弧形
  const torso = box(u(230), u(104), u(540), black, [0, u(270), 0]);
  g.add(torso);
  // 上表面弧形盖板（低矮，不抬高整机剪影）
  const shellTop = new THREE.Mesh(new THREE.CylinderGeometry(u(56), u(56), u(516), 18, 1, false, 0, Math.PI), black);
  shellTop.rotation.set(Math.PI / 2, 0, 0);
  shellTop.scale.set(2.05, 1, 1);
  shellTop.position.set(0, u(322), 0);
  g.add(shellTop);
  // 银白装饰腰线
  for (const side of [-1, 1]) {
    g.add(box(u(6), u(48), u(496), grey, [side * u(116), u(270), 0]));
  }

  // 头部：半球形 4D 广角激光雷达 L2（最显眼特征）+ 广角相机 + 前照灯
  const headBox = box(u(186), u(92), u(120), black, [0, u(280), u(318)]);
  g.add(headBox);
  const lidar = new THREE.Mesh(new THREE.SphereGeometry(u(32), 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), grey);
  lidar.position.set(0, u(352), u(330));
  g.add(lidar);
  g.add(cyl(u(13), u(13), u(8), M.darkSteel(), [0, u(282), u(379)], [Math.PI / 2, 0, 0], 20));
  g.add(box(u(64), u(11), u(5), light, [0, u(252), u(379)]));
  // 尾部状态灯
  g.add(box(u(58), u(9), u(4), light, [0, u(280), -u(272)]));

  // 四腿：两段式扁平连杆，膝内走线；髋外摆电机为外露扁圆柱
  const leg = (x, z, front) => {
    const side = Math.sign(x);
    // 髋外摆电机
    g.add(cyl(u(36), u(36), u(44), grey, [x + side * u(22), u(268), z], [0, 0, Math.PI / 2], 20));
    // 大腿（髋俯仰）
    const thigh = box(u(32), u(182), u(56), black, [x + side * u(36), u(182), z + (front ? u(13) : -u(13))], [front ? -0.16 : 0.16, 0, 0]);
    g.add(thigh);
    // 膝关节
    g.add(cyl(u(23), u(23), u(36), grey, [x + side * u(36), u(96), z + (front ? u(28) : -u(28))], [0, 0, Math.PI / 2], 16));
    // 小腿
    g.add(box(u(23), u(164), u(36), black, [x + side * u(36), u(52), z + (front ? u(4) : -u(4))], [front ? 0.30 : -0.30, 0, 0]));
    // 足端半球橡胶垫
    g.add(sph(u(18), M.rubber(), [x + side * u(36), u(17), z + (front ? -u(22) : u(22))]));
  };
  leg(u(112), u(212), true); leg(-u(112), u(212), true);
  leg(u(112), -u(212), false); leg(-u(112), -u(212), false);

  return g;
}

async function printedChair() {
  // Joris Laarman Maker Chair：780×540×650
  const g = new THREE.Group();
  const s = 1 / 950;
  const u = (mm) => mm * s;

  const mat = M.filament();
  const seam = M.darkSteel();

  // ── 椅背 + 坐面：一整片连续 S 形曲壳 ────────────────
  // 侧视轮廓（x = 前后进深 −325…325，y = 高 0…780），沿 Z 拉伸出 540 宽
  const shape = new THREE.Shape();
  shape.moveTo(-u(300), u(400));                                   // 背板底
  shape.bezierCurveTo(-u(330), u(560), -u(300), u(680), -u(238), u(780)); // 背板外弧
  shape.lineTo(-u(168), u(780));
  shape.bezierCurveTo(-u(232), u(670), -u(258), u(550), -u(238), u(452)); // 背板内弧
  shape.bezierCurveTo(-u(120), u(408), u(140), u(400), u(300), u(418));   // 坐面（微凹）
  shape.lineTo(u(325), u(372));
  shape.bezierCurveTo(u(120), u(350), -u(140), u(352), -u(300), u(362));
  shape.lineTo(-u(300), u(400));
  const shell = extrude(shape, u(540), mat);
  shell.position.set(0, 0, -u(270));
  g.add(shell);

  // ── 四条锥形收细的椅腿（与壳体过渡无接缝）───────────
  for (const x of [u(262), -u(262)]) {
    for (const z of [u(215), -u(215)]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(u(30), u(17), u(392), 14), mat);
      leg.position.set(x, u(196), z);
      leg.rotation.set(z > 0 ? -0.05 : 0.05, 0, x > 0 ? -0.05 : 0.05);
      g.add(leg);
    }
  }
  // 腿与壳体的过渡包角
  for (const x of [u(258), -u(258)]) {
    for (const z of [u(212), -u(212)]) {
      g.add(sph(u(34), mat, [x, u(378), z]));
    }
  }

  // ── 可拼合立体拼图块的分缝线（真作最显著特征）────────
  for (let y = u(430); y < u(770); y += u(78)) {
    g.add(box(u(2.5), u(2.5), u(548), seam, [-u(250), y, 0]));      // 背板横缝
  }
  for (let z = -u(200); z <= u(200); z += u(100)) {
    g.add(box(u(600), u(2.5), u(2.5), seam, [0, u(408), z]));       // 坐面纵缝
  }
  for (let x = -u(240); x <= u(280); x += u(130)) {
    g.add(box(u(2.5), u(2.5), u(548), seam, [x, u(404), 0]));       // 坐面横缝
  }

  return g;
}

async function latticeTable() {
  // Gradient Coffee Table 形制：1490×560×450
  const g = new THREE.Group();
  const s = 1 / 1800;
  const u = (mm) => mm * s;

  // 真作为 3D 打印混凝土：连续水平层条堆叠，层高约 8 mm，
  // 层轮廓渐变错位形成等高线外观；单件内色相由一端平滑过渡到另一端。
  // 单件内色相由一端平滑过渡到另一端 —— 用一张横向渐变贴图统一覆盖所有层条
  const grad = makePatternTexture((ctx, size) => {
    const lg = ctx.createLinearGradient(0, 0, size, 0);
    lg.addColorStop(0.00, '#d9917a');   // 陶土粉
    lg.addColorStop(0.42, '#b98f8c');
    lg.addColorStop(0.75, '#8b94a6');
    lg.addColorStop(1.00, '#6f8098');   // 水泥蓝灰
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, size, size);
    // 混凝土颗粒噪点
    for (let i = 0; i < 5200; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.07})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }, 512);
  const mat = new THREE.MeshStandardMaterial({ map: grad, roughness: 0.93, metalness: 0.02 });

  const LAYER = 9;                        // 层高 mm
  const layers = Math.round(450 / LAYER); // 50 层
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const y = u(LAYER * 0.5 + i * LAYER);
    // 层轮廓渐变错位形成等高线外观（用位移而非旋转，避免包围盒膨胀）
    const w = u(1490) * (0.90 + 0.10 * Math.sin(t * Math.PI));
    const d = u(500) * (0.84 + 0.16 * Math.cos(t * Math.PI * 1.6));
    const zOff = u(28) * Math.sin(t * Math.PI * 2.2);
    g.add(box(w, u(LAYER * 0.94), d, mat, [0, y, zOff]));
    // 挤出料条的圆弧截面：前后缘各压一根卧倒圆柱
    for (const sgn of [-1, 1]) {
      g.add(cyl(u(LAYER * 0.47), u(LAYER * 0.47), w, mat,
        [0, y, zOff + sgn * d / 2], [0, 0, Math.PI / 2], 8));
    }
  }

  return g;
}

export const MODERN = {
  'concept-car': conceptCar,
  'evtol-aircraft': evtol,
  'smart-watch': smartWatch,
  'ar-glasses': arGlasses,
  'humanoid-robot': humanoidRobot,
  'robot-dog': robotDog,
  'printed-chair': printedChair,
  'lattice-table': latticeTable,
};
