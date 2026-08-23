/**
 * kit.mjs — 浏览器内程序化建模工具库（真实展品还原版）
 * 基于 three.js 构建展品几何体，由浏览器端 GLTFExporter 导出为 .glb
 */
import * as THREE from 'three';

export { THREE };

/* ------------------------------------------------------------------ */
/* 材质预设                                                            */
/* ------------------------------------------------------------------ */

const cache = new Map();

function mat(name, params) {
  const key = name + JSON.stringify(params);
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshStandardMaterial(params);
  m.name = name;
  cache.set(key, m);
  return m;
}

export function clearMatCache() { cache.clear(); }

export const M = {
  bronzePatina: () => mat('bronze_patina', { color: 0x6f8467, metalness: 0.72, roughness: 0.58 }),
  bronzeDark: () => mat('bronze_dark', { color: 0x6d5530, metalness: 0.9, roughness: 0.42 }),
  bronzeWorn: () => mat('bronze_worn', { color: 0x8a7444, metalness: 0.85, roughness: 0.5 }),
  gold: () => mat('gold', { color: 0xd8b04a, metalness: 1, roughness: 0.24 }),
  silver: () => mat('silver', { color: 0xc9ced4, metalness: 1, roughness: 0.28 }),
  steel: () => mat('steel', { color: 0x9aa3ad, metalness: 0.92, roughness: 0.32 }),
  darkSteel: () => mat('dark_steel', { color: 0x3d444d, metalness: 0.85, roughness: 0.4 }),
  jadeGreen: () => mat('jade_green', { color: 0x7cab92, metalness: 0.05, roughness: 0.16 }),
  jadeWhite: () => mat('jade_white', { color: 0xe4e7da, metalness: 0.03, roughness: 0.2 }),
  porcelain: () => mat('porcelain', { color: 0xf3f5f6, metalness: 0.02, roughness: 0.1 }),
  porcelainBlue: () => mat('porcelain_blue', { color: 0x2a5199, metalness: 0.05, roughness: 0.14 }),
  terracotta: () => mat('terracotta', { color: 0xb1592f, metalness: 0.02, roughness: 0.72 }),
  blackGlaze: () => mat('black_glaze', { color: 0x1a1a1c, metalness: 0.08, roughness: 0.32 }),
  bone: () => mat('bone', { color: 0xd8ceb4, metalness: 0, roughness: 0.86 }),
  boneDark: () => mat('bone_dark', { color: 0xa89778, metalness: 0, roughness: 0.9 }),
  rock: () => mat('rock', { color: 0x776b5c, metalness: 0.02, roughness: 0.94 }),
  darkRock: () => mat('dark_rock', { color: 0x45444a, metalness: 0.05, roughness: 0.9 }),
  meteorite: () => mat('meteorite', { color: 0x38332d, metalness: 0.55, roughness: 0.65 }),
  wood: () => mat('wood', { color: 0x7d5a3a, metalness: 0, roughness: 0.75 }),
  petrified: () => mat('petrified', { color: 0x9c6c3f, metalness: 0.08, roughness: 0.55 }),
  soil: () => mat('soil', { color: 0x5c4b38, metalness: 0, roughness: 0.95 }),
  foliage: () => mat('foliage', { color: 0x3f6b3a, metalness: 0, roughness: 0.8 }),
  bamboo: () => mat('bamboo', { color: 0x7f9c48, metalness: 0, roughness: 0.7 }),
  silkYellow: () => mat('silk_yellow', { color: 0xe0b93c, metalness: 0.14, roughness: 0.52 }),
  silkRed: () => mat('silk_red', { color: 0xa32b26, metalness: 0.1, roughness: 0.58 }),
  kingfisher: () => mat('kingfisher', { color: 0x2f7fa8, metalness: 0.35, roughness: 0.35 }),
  carPaint: (c = 0xc8352a) => mat('car_paint_' + c, { color: c, metalness: 0.62, roughness: 0.22 }),
  carbon: () => mat('carbon', { color: 0x2a2e35, metalness: 0.5, roughness: 0.42 }),
  whitePoly: () => mat('white_poly', { color: 0xeef1f4, metalness: 0.1, roughness: 0.42 }),
  techBlue: () => mat('tech_blue', { color: 0x2f6df6, metalness: 0.3, roughness: 0.3 }),
  techCyan: () => mat('tech_cyan', { color: 0x37c8d8, metalness: 0.2, roughness: 0.25 }),
  rubber: () => mat('rubber', { color: 0x1d1f22, metalness: 0.05, roughness: 0.85 }),
  solarPanel: () => mat('solar_panel', { color: 0x161d2b, metalness: 0.55, roughness: 0.24 }),
  polishedAlu: () => mat('polished_alu', { color: 0xd7dade, metalness: 0.92, roughness: 0.18 }),
  filament: () => mat('filament', { color: 0xe4e0d5, metalness: 0.04, roughness: 0.62 }),
  furTiger: () => mat('fur_tiger', { color: 0xc9822d, metalness: 0, roughness: 0.88 }),
  furStripe: () => mat('fur_stripe', { color: 0x241c15, metalness: 0, roughness: 0.9 }),
  furWhite: () => mat('fur_white', { color: 0xf1eee7, metalness: 0, roughness: 0.88 }),
  furBlack: () => mat('fur_black', { color: 0x1e1c1b, metalness: 0, roughness: 0.9 }),
  furGold: () => mat('fur_gold', { color: 0xd08f2e, metalness: 0, roughness: 0.86 }),
  skinBlue: () => mat('skin_blue', { color: 0x6d8fb8, metalness: 0, roughness: 0.7 }),
  mammothFur: () => mat('mammoth_fur', { color: 0x6b4b2f, metalness: 0, roughness: 0.92 }),
  mammothFurDark: () => mat('mammoth_fur_dark', { color: 0x46301c, metalness: 0, roughness: 0.94 }),
  ivory: () => mat('ivory', { color: 0xe8e0c8, metalness: 0.02, roughness: 0.5 }),
  glass: () => mat('glass', { color: 0xbfe2f0, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.28 }),
  liquid: () => mat('liquid', { color: 0xc9d9b8, metalness: 0, roughness: 0.15, transparent: true, opacity: 0.42 }),
  specimen: () => mat('specimen', { color: 0xd7b9a4, metalness: 0, roughness: 0.6 }),
  concrete: () => mat('concrete', { color: 0x9a9186, metalness: 0.02, roughness: 0.9 }),
  holoLens: () => mat('hololens', { color: 0x2a2a2e, metalness: 0.3, roughness: 0.5 }),
  visor: () => mat('visor', { color: 0x8896a8, metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.55 }),
  titanium: () => mat('titanium', { color: 0xc4c6c8, metalness: 0.85, roughness: 0.28 }),
  orangeBtn: () => mat('orange_btn', { color: 0xff6b1a, metalness: 0.1, roughness: 0.45 }),
};

export function color(hex, metalness = 0.1, roughness = 0.6, extra = {}) {
  return new THREE.MeshStandardMaterial({ color: hex, metalness, roughness, ...extra });
}

/* ------------------------------------------------------------------ */
/* 纹理加载（浏览器）                                                   */
/* ------------------------------------------------------------------ */

/** 从 URL 加载图像为 CanvasTexture，并设置 JPEG 导出 */
export async function loadTexture(url, mimeType = 'image/jpeg') {
  const img = new Image();
  img.src = url;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  const tex = new THREE.CanvasTexture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.mimeType = mimeType;
  tex.name = url.split('/').pop().split('?')[0];
  return tex;
}

/** 用 Canvas 绘制重复图案纹理（ procedural ） */
export function makePatternTexture(drawFn, size = 512, mimeType = 'image/jpeg') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.mimeType = mimeType;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/* ------------------------------------------------------------------ */
/* 基础几何辅助                                                        */
/* ------------------------------------------------------------------ */

export function box(w, h, d, material, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function cyl(rt, rb, h, material, pos = [0, 0, 0], rot = [0, 0, 0], seg = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(...pos); m.rotation.set(...rot);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function sph(r, material, pos = [0, 0, 0], seg = 24) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), material);
  m.position.set(...pos);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function cone(rt, rb, h, material, pos = [0, 0, 0], rot = [0, 0, 0], seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, true), material);
  m.position.set(...pos); m.rotation.set(...rot);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function torus(r, tube, material, pos = [0, 0, 0], rot = [0, 0, 0], rs = 24, ts = 12) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, ts, rs), material);
  m.position.set(...pos); m.rotation.set(...rot);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function tube(path, radius, material, seg = 64) {
  const geo = new THREE.TubeGeometry(path, seg, radius, 8, false);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function lathe(points, material, seg = 64) {
  const vecs = points.map((p) => new THREE.Vector2(p[0], p[1]));
  const geo = new THREE.LatheGeometry(vecs, seg);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function extrude(shape, depth, material) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.005, bevelThickness: 0.005, steps: 1 });
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function ring(ir, or, material, pos = [0, 0, 0], rot = [0, 0, 0], seg = 48) {
  const m = new THREE.Mesh(new THREE.RingGeometry(ir, or, seg), material);
  m.position.set(...pos); m.rotation.set(...rot);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function group(name, ...children) {
  const g = new THREE.Group();
  g.name = name;
  children.forEach((c) => g.add(c));
  return g;
}

/* 确定性伪随机 */
export function rng(seed = 1) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ------------------------------------------------------------------ */
/* 包围盒 / 姿态标准化                                                 */
/* ------------------------------------------------------------------ */

export function normalize(obj) {
  const box = new THREE.Box3().setFromObject(obj, true);
  const c = box.getCenter(new THREE.Vector3());
  const s = box.getSize(new THREE.Vector3());
  obj.position.x -= c.x;
  obj.position.z -= c.z;
  obj.position.y -= box.min.y; // 底面贴 y=0
  return { size: s, center: c };
}

export function bounds(obj) {
  const box = new THREE.Box3().setFromObject(obj, true);
  return { size: box.getSize(new THREE.Vector3()), min: box.min, max: box.max };
}

/* ------------------------------------------------------------------ */
/* UV 辅助：把纹理投影到简单几何体                                      */
/* ------------------------------------------------------------------ */

/**
 * 为 BoxGeometry 的指定面设置独立材质。
 * 面的顺序：+x, -x, +y, -y, +z, -z
 */
export function boxWithFaces(w, h, d, materials, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, materials);
  m.position.set(...pos); m.rotation.set(...rot);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/** 圆柱/旋转体：把 Canvas 纹理圆柱投影 */
export function cylWrap(rt, rb, h, texture, materialBase, pos = [0, 0, 0], seg = 64) {
  const mat = materialBase.clone();
  mat.map = texture;
  mat.color.setHex(0xffffff);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, true), mat);
  m.position.set(...pos);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* ------------------------------------------------------------------ */
/* 程序化图案生成（Canvas）                                             */
/* ------------------------------------------------------------------ */

export function furPattern(baseColor, stripeColor, scale = 1) {
  return makePatternTexture((ctx, size) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = stripeColor;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < size * 2; i += Math.floor(14 * scale)) {
      const x = i + Math.random() * 8;
      const w = Math.floor(4 + Math.random() * 5);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + w * 0.5, size);
      ctx.lineTo(x - w * 0.5, size);
      ctx.lineTo(x - w, 0);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, 512);
}

export function pandaPattern() {
  return makePatternTexture((ctx, size) => {
    ctx.fillStyle = '#f1eee7';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#1e1c1b';
    // 耳朵
    ctx.beginPath(); ctx.arc(size * 0.2, size * 0.18, size * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(size * 0.8, size * 0.18, size * 0.12, 0, Math.PI * 2); ctx.fill();
    // 眼圈
    ctx.beginPath(); ctx.ellipse(size * 0.32, size * 0.45, size * 0.14, size * 0.1, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(size * 0.68, size * 0.45, size * 0.14, size * 0.1, 0.3, 0, Math.PI * 2); ctx.fill();
    // 肩带
    ctx.fillRect(0, size * 0.55, size, size * 0.35);
    // 后肢
    ctx.fillRect(size * 0.72, size * 0.75, size * 0.28, size * 0.25);
  }, 512);
}

export function monkeyPattern() {
  return makePatternTexture((ctx, size) => {
    ctx.fillStyle = '#d08f2e';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#5c4b38'; // 冠毛/四肢
    ctx.fillRect(0, 0, size, size * 0.22);
    ctx.fillRect(0, size * 0.78, size, size * 0.22);
    ctx.fillStyle = '#8fb8d8'; // 面部
    ctx.beginPath(); ctx.ellipse(size * 0.5, size * 0.42, size * 0.22, size * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  }, 512);
}
