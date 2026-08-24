/**
 * 展品自动对齐布局引擎
 *
 * 职责：
 *   1. 把展品按 tier 自动匹配到模板声明的展台槽位（数量不齐时自动溢出/补位）
 *   2. 加载真实 GLB，按精确包围盒等比缩放 → 水平居中 → 底面吸附台面
 *   3. 生成展签、拾取代理、悬停高亮句柄
 *
 * 换模板、增删展品都不需要手工填坐标。
 */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { assignSlots } from './slots.js';

const MODEL_DIR = './models/';

// 与详情页平面图共用同一套分配结果，保证展品编号一致
export { assignSlots };

/* ==================================================================== */
/* 展签（Canvas 贴图，零外链）                                            */
/* ==================================================================== */

function makePlaque(exhibit, accent) {
  const W = 512, H = 256;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');

  c.fillStyle = '#f4f1ea';
  c.fillRect(0, 0, W, H);
  c.fillStyle = accent;
  c.fillRect(0, 0, W, 10);

  c.fillStyle = '#1a1c20';
  c.font = '600 40px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
  c.textBaseline = 'top';

  // 名称自动换行
  const name = exhibit.name;
  const lines = [];
  let cur = '';
  for (const ch of name) {
    if (c.measureText(cur + ch).width > W - 56) { lines.push(cur); cur = ch; }
    else cur += ch;
    if (lines.length >= 2) break;
  }
  if (cur && lines.length < 2) lines.push(cur);
  lines.forEach((ln, i) => c.fillText(ln, 28, 34 + i * 48));

  const y0 = 34 + lines.length * 48 + 8;
  c.fillStyle = '#6a7078';
  c.font = '400 24px -apple-system, "PingFang SC", sans-serif';
  c.fillText(exhibit.en, 28, y0);
  c.fillStyle = '#3c4148';
  c.font = '500 26px -apple-system, "PingFang SC", sans-serif';
  c.fillText(exhibit.era, 28, y0 + 36);

  c.strokeStyle = '#cfc9bd';
  c.lineWidth = 3;
  c.strokeRect(1.5, 1.5, W - 3, H - 3);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.23), mat);
  mesh.userData.isPlaque = true;
  return mesh;
}

/* ==================================================================== */
/* 主流程                                                                */
/* ==================================================================== */

/**
 * @returns {Promise<{records:Array, group:THREE.Group, pickTargets:Array}>}
 *   record = { exhibit, slot, root, box, center, top, radius, plaque, ring }
 */
export async function placeExhibits({ tpl, hall, exhibits, accent = '#2f6df6', onProgress }) {
  const { pairs } = assignSlots(tpl, exhibits);
  const loader = new GLTFLoader();
  const group = new THREE.Group();
  group.name = 'exhibits';
  const records = [];
  const pickTargets = [];

  // 展台 group 按 slot.id 索引，展品直接挂到对应展台下（自动继承 face 朝向）
  const pedByslot = new Map(hall.pedestals.map((p) => [p.slot.id, p]));

  let done = 0;
  const total = pairs.length;

  const jobs = pairs.map(({ exhibit, slot }) =>
    loader
      .loadAsync(MODEL_DIR + exhibit.id + '.glb')
      .then((gltf) => ({ exhibit, slot, scene: gltf.scene }))
      .catch((err) => {
        console.error('[layout] GLB 加载失败：', exhibit.id, err);
        return { exhibit, slot, scene: null };
      })
      .then((r) => {
        done++;
        onProgress?.(done, total, exhibit.name);
        return r;
      })
  );

  const loaded = await Promise.all(jobs);

  for (const { exhibit, slot, scene } of loaded) {
    if (!scene) continue;
    const ped = pedByslot.get(slot.id);
    if (!ped) continue;

    /* ---- 1. 精确包围盒 ---- */
    const raw = new THREE.Box3().setFromObject(scene, true);
    const dim = raw.getSize(new THREE.Vector3());
    const ctr = raw.getCenter(new THREE.Vector3());
    if (!isFinite(dim.x) || dim.x <= 0) continue;

    /* ---- 2. 等比缩放：目标尺寸 + 台面约束 + 净高约束 ---- */
    const maxDim = Math.max(dim.x, dim.y, dim.z);
    const [fw, fd] = slot.fp;
    // 玻璃柜内净高 1.02m；其他展台留出到天花的余量
    const headroom = slot.style === 'case' ? 1.0 : tpl.size.h - slot.h - 1.2;

    let s = exhibit.size / maxDim;                       // 先按声明的真实尺寸
    s = Math.min(s, (fw * 0.88) / dim.x);                // 台面宽度约束
    s = Math.min(s, (fd * 0.88) / dim.z);                // 台面进深约束
    s = Math.min(s, headroom / dim.y);                   // 净高约束

    /* ---- 3. 水平居中 + 底面吸附台面 ---- */
    const inner = new THREE.Group();
    scene.position.set(-ctr.x, -raw.min.y, -ctr.z);      // 归到「中心-底面」姿态
    inner.add(scene);
    // 个别原始资产的正前方轴与展厅 +Z 约定不同，只修正模型，不影响展台与展签。
    inner.rotation.y = exhibit.displayYaw || 0;
    inner.scale.setScalar(s);

    const wrap = new THREE.Group();
    wrap.name = 'exhibit:' + exhibit.id;
    wrap.position.y = slot.h + 0.035;                    // 台面顶
    wrap.add(inner);
    ped.group.add(wrap);                                 // 继承展台的 face 旋转

    /* ---- 4. 阴影 / 拾取标记 ---- */
    scene.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.userData.exhibitId = exhibit.id;
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (m.emissive) o.userData._em = o.userData._em || mats.map((x) => x.emissive?.getHex() ?? 0);
        });
      }
      pickTargets.push(o);
    });

    /* ---- 5. 展签：贴在展台前沿，仰角 28° ---- */
    const plaque = makePlaque(exhibit, accent);
    const frontZ = slot.style === 'platform' ? (fd + 1.1) / 2 - 0.16 : fd / 2 + 0.02;
    plaque.position.set(0, slot.h + 0.10, frontZ);
    plaque.rotation.x = -Math.PI / 2 + 0.49;
    if (slot.style === 'case') plaque.position.y = slot.h + 1.24;   // 柜顶
    ped.group.add(plaque);

    /* ---- 6. 选中光圈（默认隐藏） ---- */
    const sized = new THREE.Box3().setFromObject(wrap, true);
    const sd = sized.getSize(new THREE.Vector3());
    const rad = Math.max(sd.x, sd.z) * 0.62 + 0.12;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(rad, rad + 0.07, 48),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = slot.h + 0.05;
    ring.visible = false;
    ring.renderOrder = 3;
    ped.group.add(ring);

    const worldCenter = new THREE.Vector3();
    sized.getCenter(worldCenter);

    records.push({
      exhibit, slot, root: wrap, plaque, ring,
      size: sd,
      center: worldCenter,
      top: sized.max.y,
      radius: Math.max(sd.x, sd.y, sd.z) * 0.5,
      scale: s,
    });
  }

  records.sort((a, b) => exhibits.indexOf(a.exhibit) - exhibits.indexOf(b.exhibit));
  return { records, group, pickTargets };
}

/* ==================================================================== */
/* 高亮                                                                  */
/* ==================================================================== */

export function setHighlight(record, on, color = 0x63a4ff) {
  if (!record) return;
  record.ring.visible = on;
  record.root.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m, i) => {
      if (!m.emissive) return;
      if (on) {
        if (m.userData.__baseEm === undefined) m.userData.__baseEm = m.emissive.getHex();
        if (m.userData.__baseEmI === undefined) m.userData.__baseEmI = m.emissiveIntensity ?? 1;
        m.emissive.setHex(color);
        m.emissiveIntensity = 0.28;
      } else if (m.userData.__baseEm !== undefined) {
        m.emissive.setHex(m.userData.__baseEm);
        m.emissiveIntensity = m.userData.__baseEmI;
      }
    });
  });
}

/**
 * 依据展品实际位置生成导览路点（环厅顺序 + 每点一个观看角）
 */
export function buildTourRoute(records, tpl) {
  return records.map((r) => {
    const c = r.center.clone();
    const dist = Math.max(2.2, r.radius * 2.6 + 1.4);
    const face = r.slot.face || 0;
    // 站在展品正面方向 dist 处
    const eye = new THREE.Vector3(
      c.x + Math.sin(face) * dist,
      Math.min(tpl.size.h - 1.2, c.y + r.size.y * 0.22 + 0.6),
      c.z + Math.cos(face) * dist
    );
    // 夹在厅内
    const hw = tpl.size.w / 2 - 1.2, hd = tpl.size.d / 2 - 1.2;
    eye.x = Math.max(-hw, Math.min(hw, eye.x));
    eye.z = Math.max(-hd, Math.min(hd, eye.z));
    return { exhibit: r.exhibit, eye, look: c.clone(), record: r };
  });
}
