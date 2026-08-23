/**
 * 展厅建筑生成器 —— 按模板生成地面、墙体、天花、展台、灯具
 * 同时产出碰撞盒（漫游模式用）与导览路点
 */
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function std(color, rough = 0.9, metal = 0.02, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
}

/* ------------------------------------------------------------------ */

export function buildHall(tpl) {
  const root = new THREE.Group();
  root.name = 'hall';
  const { w, d, h } = tpl.size;
  const P = tpl.palette;
  const colliders = [];   // {min:{x,z}, max:{x,z}}
  const pedestals = [];   // 展台信息，供布局引擎使用

  const addCollider = (cx, cz, sw, sd) =>
    colliders.push({ minX: cx - sw / 2, maxX: cx + sw / 2, minZ: cz - sd / 2, maxZ: cz + sd / 2 });

  /* ---------- 地面 ---------- */
  const floorMat = std(P.floor, 0.72, 0.06);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // 地面分格线
  const lineMat = new THREE.LineBasicMaterial({ color: P.floorLine, transparent: true, opacity: 0.5 });
  const gridPts = [];
  const step = 2;
  for (let x = -w / 2; x <= w / 2 + 0.001; x += step) gridPts.push(V(x, 0.006, -d / 2), V(x, 0.006, d / 2));
  for (let z = -d / 2; z <= d / 2 + 0.001; z += step) gridPts.push(V(-w / 2, 0.006, z), V(w / 2, 0.006, z));
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPts), lineMat);
  root.add(grid);

  // 中轴引导带
  const runner = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 3, Math.min(3.2, d * 0.22)),
    std(P.accent, 0.85, 0.05, { transparent: true, opacity: 0.10 })
  );
  runner.rotation.x = -Math.PI / 2;
  runner.position.y = 0.008;
  root.add(runner);

  /* ---------- 墙体 ---------- */
  const wallMat = std(P.wall, 0.94, 0.02);
  const wallT = 0.4;
  const walls = [
    [0, h / 2, -d / 2 - wallT / 2, w + wallT * 2, h, wallT],
    [0, h / 2, d / 2 + wallT / 2, w + wallT * 2, h, wallT],
    [-w / 2 - wallT / 2, h / 2, 0, wallT, h, d],
    [w / 2 + wallT / 2, h / 2, 0, wallT, h, d],
  ];
  walls.forEach(([x, y, z, sw, sh, sd]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), wallMat);
    m.position.set(x, y, z);
    m.receiveShadow = true;
    root.add(m);
  });
  // 踢脚线
  const skirtMat = std(P.trim, 0.6, 0.35);
  [[0, -d / 2 + 0.05, w, 0.1], [0, d / 2 - 0.05, w, 0.1]].forEach(([x, z, sw, sd]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.18, sd), skirtMat);
    m.position.set(x, 0.09, z);
    root.add(m);
  });
  [[-w / 2 + 0.05, 0, 0.1, d], [w / 2 - 0.05, 0, 0.1, d]].forEach(([x, z, sw, sd]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.18, sd), skirtMat);
    m.position.set(x, 0.09, z);
    root.add(m);
  });

  /* ---------- 天花 ---------- */
  const ceilMat = std(P.ceiling, 0.95, 0.05);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = h;
  root.add(ceil);

  const lightStrips = [];

  /* ---------- 按模板做特征构件 ---------- */
  if (tpl.name === '现代开放式') {
    // 天花金属横梁 + 线性灯带
    const beamMat = std(P.trim, 0.45, 0.75);
    for (let i = -4; i <= 4; i++) {
      const z = (i / 4) * (d / 2 - 1.5);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(w - 0.6, 0.28, 0.34), beamMat);
      beam.position.set(0, h - 0.2, z);
      root.add(beam);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w - 2.4, 0.06, 0.16), std(0xffffff, 1, 0));
      strip.material.emissive = new THREE.Color(0xffffff);
      strip.material.emissiveIntensity = 1.4;
      strip.position.set(0, h - 0.38, z);
      root.add(strip);
      lightStrips.push([0, h - 0.5, z]);
    }
    // 侧墙玻璃幕感：竖向亮条
    for (let i = -6; i <= 6; i++) {
      [-1, 1].forEach((s) => {
        const g = new THREE.Mesh(new THREE.BoxGeometry(0.08, h - 1.0, 0.08), std(P.accent, 0.4, 0.3));
        g.material.emissive = new THREE.Color(P.accent);
        g.material.emissiveIntensity = 0.35;
        g.position.set(s * (w / 2 - 0.12), (h - 1.0) / 2 + 0.2, (i / 6) * (d / 2 - 1.2));
        root.add(g);
      });
    }
  }

  if (tpl.name === '古典长廊式') {
    // 两侧列柱
    const colMat = std(0xd9cdb4, 0.85, 0.03);
    const capMat = std(P.trim, 0.6, 0.4);
    for (let i = -5; i <= 5; i++) {
      const x = (i / 5) * (w / 2 - 2.2);
      [-1, 1].forEach((s) => {
        const z = s * (d / 2 - 1.0);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, h - 1.1, 20), colMat);
        shaft.position.set(x, (h - 1.1) / 2 + 0.35, z);
        shaft.castShadow = true;
        root.add(shaft);
        // 凹槽
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          const fl = new THREE.Mesh(new THREE.BoxGeometry(0.06, h - 1.3, 0.1), std(0xc9bda4, 0.9));
          fl.position.set(x + Math.cos(a) * 0.35, (h - 1.1) / 2 + 0.35, z + Math.sin(a) * 0.35);
          fl.rotation.y = -a;
          root.add(fl);
        }
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 1.0), capMat);
        base.position.set(x, 0.175, z);
        root.add(base);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 1.1), capMat);
        cap.position.set(x, h - 0.55, z);
        root.add(cap);
        addCollider(x, z, 0.9, 0.9);
      });
    }
    // 藻井格
    const coffer = std(0x5b4c3d, 0.92);
    for (let i = -5; i <= 5; i++) {
      for (let j = -1; j <= 1; j++) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 2.6), coffer);
        c.position.set((i / 5) * (w / 2 - 2), h - 0.12, j * 3.2);
        root.add(c);
      }
    }
    // 檐口灯带（暖光）
    [-1, 1].forEach((s) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w - 1.5, 0.1, 0.2), std(0xffe6bd, 1, 0));
      strip.material.emissive = new THREE.Color(0xffd9a0);
      strip.material.emissiveIntensity = 1.1;
      strip.position.set(0, h - 0.95, s * (d / 2 - 0.35));
      root.add(strip);
    });
    for (let i = -4; i <= 4; i++) lightStrips.push([(i / 4) * (w / 2 - 3), h - 1.2, 0]);
    // 端墙壁龛拱
    [-1, 1].forEach((s) => {
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.5, 24, 1, false, 0, Math.PI), std(0xd8ccb2, 0.9));
      arch.rotation.z = -Math.PI / 2;
      arch.rotation.y = Math.PI / 2;
      arch.position.set(s * (w / 2 - 0.3), 3.0, 0);
      root.add(arch);
    });
  }

  if (tpl.name === '自然史穹顶厅') {
    // 穹顶桁架
    const trussMat = std(P.trim, 0.5, 0.7);
    for (let i = -5; i <= 5; i++) {
      const z = (i / 5) * (d / 2 - 1.5);
      const arcPts = [];
      for (let k = 0; k <= 20; k++) {
        const t = k / 20;
        arcPts.push(V(-w / 2 + t * w, h - 0.6 - Math.sin(t * Math.PI) * 1.6, z));
      }
      const curve = new THREE.CatmullRomCurve3(arcPts);
      const truss = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.13, 6), trussMat);
      root.add(truss);
    }
    for (let i = -7; i <= 7; i++) {
      const x = (i / 7) * (w / 2 - 1.5);
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, d - 2), trussMat);
      rod.position.set(x, h - 1.0, 0);
      root.add(rod);
    }
    // 顶部天窗光带
    for (let i = -2; i <= 2; i++) {
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(w - 6, 2.2), std(0xdff0ff, 1, 0));
      sky.material.emissive = new THREE.Color(0xcfe8ff);
      sky.material.emissiveIntensity = 1.0;
      sky.rotation.x = Math.PI / 2;
      sky.position.set(0, h - 0.05, i * 5.2);
      root.add(sky);
      lightStrips.push([0, h - 1.5, i * 5.2]);
    }
    // 环厅二层挑廊
    const balMat = std(0x4d565f, 0.8, 0.15);
    [-1, 1].forEach((s) => {
      const bal = new THREE.Mesh(new THREE.BoxGeometry(w - 1, 0.3, 3.2), balMat);
      bal.position.set(0, 5.2, s * (d / 2 - 1.8));
      root.add(bal);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w - 1, 1.0, 0.12), std(P.trim, 0.4, 0.5, { transparent: true, opacity: 0.45 }));
      rail.position.set(0, 5.85, s * (d / 2 - 3.35));
      root.add(rail);
    });
  }

  /* ---------- 展台 ---------- */
  const plinthMat = std(tpl.name === '古典长廊式' ? 0x4b4038 : 0x2f3640, 0.75, 0.12);
  const topMat = std(tpl.name === '古典长廊式' ? 0xb59b6e : 0x59636e, 0.45, 0.4);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdff0ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16,
    side: THREE.DoubleSide, depthWrite: false,
  });

  tpl.slots.forEach((slot) => {
    const [x, z] = slot.pos;
    const [fw, fd] = slot.fp;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = slot.face || 0;

    if (slot.style === 'platform') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(fw + 1.0, slot.h, fd + 1.0), plinthMat);
      base.position.y = slot.h / 2;
      base.receiveShadow = true;
      g.add(base);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(fw + 1.1, 0.05, fd + 1.1), topMat);
      cap.position.y = slot.h + 0.005;
      g.add(cap);
      addCollider(x, z, fw + 1.0, fd + 1.0);
    } else if (slot.style === 'plinth' || slot.style === 'niche') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.92, slot.h, fd * 0.92), plinthMat);
      base.position.y = slot.h / 2;
      base.castShadow = true;
      base.receiveShadow = true;
      g.add(base);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.06, fd), topMat);
      cap.position.y = slot.h + 0.01;
      g.add(cap);
      addCollider(x, z, fw, fd);
      if (slot.style === 'niche') {
        // 背板
        const bp = new THREE.Mesh(new THREE.BoxGeometry(fw * 1.3, 2.6, 0.12), std(P.trim, 0.8, 0.15));
        bp.position.set(0, 1.5, -fd * 0.72);
        g.add(bp);
      }
    } else if (slot.style === 'case') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(fw * 1.05, slot.h, fd * 1.05), plinthMat);
      base.position.y = slot.h / 2;
      base.castShadow = true;
      g.add(base);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(fw * 1.12, 0.05, fd * 1.12), topMat);
      cap.position.y = slot.h + 0.005;
      g.add(cap);
      // 玻璃罩
      const ch = 1.15;
      const cover = new THREE.Mesh(new THREE.BoxGeometry(fw * 1.05, ch, fd * 1.05), glassMat);
      cover.position.y = slot.h + ch / 2 + 0.03;
      cover.renderOrder = 2;
      g.add(cover);
      // 金属边框
      const fm = std(P.trim, 0.35, 0.8);
      const hw = fw * 0.525, hd = fd * 0.525;
      [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].forEach(([ex, ez]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, ch, 0.035), fm);
        post.position.set(ex, slot.h + ch / 2 + 0.03, ez);
        g.add(post);
      });
      const topFrame = new THREE.Mesh(new THREE.BoxGeometry(fw * 1.09, 0.05, fd * 1.09), fm);
      topFrame.position.y = slot.h + ch + 0.055;
      g.add(topFrame);
      addCollider(x, z, fw * 1.1, fd * 1.1);
    }
    root.add(g);

    pedestals.push({ slot, worldY: slot.h + 0.03, group: g });
  });

  return { root, colliders, pedestals, lightStrips, size: tpl.size };
}

/* ------------------------------------------------------------------ */
/* 灯光                                                                 */
/* ------------------------------------------------------------------ */

export function buildLighting(tpl, hall, scene) {
  const P = tpl.palette;
  const A = tpl.ambient;

  const hemi = new THREE.HemisphereLight(A.sky, A.ground, A.intensity);
  hemi.position.set(0, tpl.size.h, 0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, tpl.name === '古典长廊式' ? 0.55 : 0.85);
  key.position.set(tpl.size.w * 0.3, tpl.size.h * 1.4, tpl.size.d * 0.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const ext = Math.max(tpl.size.w, tpl.size.d) * 0.7;
  Object.assign(key.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: tpl.size.h * 4 });
  key.shadow.bias = -0.0008;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdce8f5, 0.40);
  fill.position.set(-tpl.size.w * 0.3, tpl.size.h, -tpl.size.d * 0.3);
  scene.add(fill);

  // 顶部灯带对应的点光源
  hall.lightStrips.forEach(([x, y, z]) => {
    const pl = new THREE.PointLight(tpl.name === '古典长廊式' ? 0xffdcae : 0xffffff, 0.42, 26, 2);
    pl.position.set(x, y, z);
    scene.add(pl);
  });

  // 每个展台一盏射灯（柔化光斑、降低刺眼高光）
  const spots = [];
  hall.pedestals.forEach(({ slot }) => {
    const [x, z] = slot.pos;
    const sp = new THREE.SpotLight(0xfff4e2, 0.65, 0, Math.PI / 6.5, 0.8, 1.4);
    sp.position.set(x, tpl.size.h - 0.8, z + 0.4);
    sp.target.position.set(x, slot.h + 0.5, z);
    scene.add(sp);
    scene.add(sp.target);
    spots.push(sp);
  });

  return { hemi, key, fill, spots };
}
