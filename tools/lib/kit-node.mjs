/**
 * kit.mjs — 程序化建模工具库
 * 基于 three.js 构建展品几何体，最终由 GLTFExporter 导出为真实 .glb 二进制文件
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs';
import path from 'node:path';

export { THREE };

/* GLTFExporter 的 binary 分支依赖浏览器 FileReader，Node 环境补一个最小实现 */
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReaderShim {
    constructor() {
      this.result = null;
      this.onloadend = null;
      this.onerror = null;
    }
    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          this.result = buf;
          if (this.onloadend) this.onloadend();
        })
        .catch((err) => {
          if (this.onerror) this.onerror(err);
          else throw err;
        });
    }
  };
}

/* ------------------------------------------------------------------ */
/* 材质预设                                                            */
/* ------------------------------------------------------------------ */

const cache = new Map();

function mat(name, params) {
  if (cache.has(name)) return cache.get(name);
  const m = new THREE.MeshStandardMaterial(params);
  m.name = name;
  cache.set(name, m);
  return m;
}

export const M = {
  // 金属 / 青铜
  bronzePatina: () => mat('bronze_patina', { color: 0x6f8467, metalness: 0.72, roughness: 0.58 }),
  bronzeDark: () => mat('bronze_dark', { color: 0x6d5530, metalness: 0.9, roughness: 0.42 }),
  bronzeWorn: () => mat('bronze_worn', { color: 0x8a7444, metalness: 0.85, roughness: 0.5 }),
  gold: () => mat('gold', { color: 0xd8b04a, metalness: 1, roughness: 0.24 }),
  silver: () => mat('silver', { color: 0xc9ced4, metalness: 1, roughness: 0.28 }),
  steel: () => mat('steel', { color: 0x9aa3ad, metalness: 0.92, roughness: 0.32 }),
  darkSteel: () => mat('dark_steel', { color: 0x3d444d, metalness: 0.85, roughness: 0.4 }),

  // 玉石 / 陶瓷
  jadeGreen: () => mat('jade_green', { color: 0x7cab92, metalness: 0.05, roughness: 0.16 }),
  jadeWhite: () => mat('jade_white', { color: 0xe4e7da, metalness: 0.03, roughness: 0.2 }),
  porcelain: () => mat('porcelain', { color: 0xf3f5f6, metalness: 0.02, roughness: 0.1 }),
  porcelainBlue: () => mat('porcelain_blue', { color: 0x2a5199, metalness: 0.05, roughness: 0.14 }),
  terracotta: () => mat('terracotta', { color: 0xb1592f, metalness: 0.02, roughness: 0.72 }),
  blackGlaze: () => mat('black_glaze', { color: 0x1a1a1c, metalness: 0.08, roughness: 0.32 }),

  // 有机 / 骨骼
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

  // 织物
  silkYellow: () => mat('silk_yellow', { color: 0xe0b93c, metalness: 0.14, roughness: 0.52 }),
  silkRed: () => mat('silk_red', { color: 0xa32b26, metalness: 0.1, roughness: 0.58 }),
  kingfisher: () => mat('kingfisher', { color: 0x2f7fa8, metalness: 0.35, roughness: 0.35 }),

  // 现代 / 工业
  carPaint: () => mat('car_paint', { color: 0xc8352a, metalness: 0.62, roughness: 0.22 }),
  carbon: () => mat('carbon', { color: 0x2a2e35, metalness: 0.5, roughness: 0.42 }),
  whitePoly: () => mat('white_poly', { color: 0xeef1f4, metalness: 0.1, roughness: 0.42 }),
  techBlue: () => mat('tech_blue', { color: 0x2f6df6, metalness: 0.3, roughness: 0.3 }),
  techCyan: () => mat('tech_cyan', { color: 0x37c8d8, metalness: 0.2, roughness: 0.25 }),
  rubber: () => mat('rubber', { color: 0x1d1f22, metalness: 0.05, roughness: 0.85 }),
  filament: () => mat('filament', { color: 0xe4e0d5, metalness: 0.04, roughness: 0.62 }),

  // 生物毛色
  furTiger: () => mat('fur_tiger', { color: 0xc9822d, metalness: 0, roughness: 0.88 }),
  furStripe: () => mat('fur_stripe', { color: 0x241c15, metalness: 0, roughness: 0.9 }),
  furWhite: () => mat('fur_white', { color: 0xf1eee7, metalness: 0, roughness: 0.88 }),
  furBlack: () => mat('fur_black', { color: 0x1e1c1b, metalness: 0, roughness: 0.9 }),
  furGold: () => mat('fur_gold', { color: 0xd08f2e, metalness: 0, roughness: 0.86 }),
  skinBlue: () => mat('skin_blue', { color: 0x6d8fb8, metalness: 0, roughness: 0.7 }),
  mammothFur: () => mat('mammoth_fur', { color: 0x6b4b2f, metalness: 0, roughness: 0.92 }),
  ivory: () => mat('ivory', { color: 0xe8e0c8, metalness: 0.02, roughness: 0.5 }),

  // 透明
  glass: () => mat('glass', { color: 0xbfe2f0, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.28 }),
  liquid: () => mat('liquid', { color: 0xc9d9b8, metalness: 0, roughness: 0.15, transparent: true, opacity: 0.42 }),
  specimen: () => mat('specimen', { color: 0xd7b9a4, metalness: 0, roughness: 0.6 }),
};

// 允许临时创建一次性材质
export function color(hex, metalness = 0.1, roughness = 0.6, extra = {}) {
  return new THREE.MeshStandardMaterial({ color: hex, metalness, roughness, ...extra });
}

/* ------------------------------------------------------------------ */
/* 基础几何辅助                                                        */
/* ------------------------------------------------------------------ */

export function box(w, h, d, material, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  return m;
}

export function cyl(rt, rb, h, material, pos = [0, 0, 0], rot = [0, 0, 0], seg = 24, open = false) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  return m;
}

export function sph(r, material, pos = [0, 0, 0], scale = [1, 1, 1], seg = 20) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2)), material);
  m.position.set(...pos);
  m.scale.set(...scale);
  return m;
}

export function cone(r, h, material, pos = [0, 0, 0], rot = [0, 0, 0], seg = 20) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  return m;
}

export function torus(r, tube, material, pos = [0, 0, 0], rot = [0, 0, 0], seg = 20, rad = 12) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, rad, seg), material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  return m;
}

/** 旋转体：profile 为 [[x,y],...] 的二维轮廓 */
export function lathe(profile, material, seg = 32, pos = [0, 0, 0]) {
  const pts = profile.map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, seg);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.position.set(...pos);
  return m;
}

/** 沿路径的管道（用于把手、支架、藤蔓） */
export function tube(points, radius, material, seg = 32, radSeg = 8, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed);
  const g = new THREE.TubeGeometry(curve, seg, radius, radSeg, closed);
  return new THREE.Mesh(g, material);
}

/** 二维形状拉伸（用于扁平片状物：叶片、翅膀、铭牌） */
export function extrude(shapePts, depth, material, opts = {}) {
  const shape = new THREE.Shape();
  shapePts.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: opts.bevel ?? true,
    bevelSize: opts.bevelSize ?? 0.004,
    bevelThickness: opts.bevelThickness ?? 0.004,
    bevelSegments: 2,
    curveSegments: opts.curveSegments ?? 8,
  });
  g.center();
  return new THREE.Mesh(g, material);
}

/** 骨骼段：两端膨大的长骨 */
export function boneSeg(len, r, material, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const g = new THREE.Group();
  g.add(cyl(r * 0.62, r * 0.62, len, material, [0, 0, 0], [0, 0, 0], 10));
  g.add(sph(r, material, [0, len / 2, 0], [1, 0.8, 1], 10));
  g.add(sph(r, material, [0, -len / 2, 0], [1, 0.8, 1], 10));
  g.position.set(...pos);
  g.rotation.set(...rot);
  return g;
}

export function group(...children) {
  const g = new THREE.Group();
  children.flat().filter(Boolean).forEach((c) => g.add(c));
  return g;
}

/** 沿 Y 轴环形阵列 */
export function ring(count, radius, fn) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const child = fn(i, a);
    if (!child) continue;
    child.position.x += Math.cos(a) * radius;
    child.position.z += Math.sin(a) * radius;
    g.add(child);
  }
  return g;
}

/** 确定性伪随机，保证每次生成的模型完全一致 */
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* 归一化 + 导出                                                       */
/* ------------------------------------------------------------------ */

/**
 * 把模型放到"以原点为中心、底面贴 y=0"的标准姿态，
 * 便于展厅侧做展台自动吸附。
 */
export function normalize(obj) {
  obj.updateMatrixWorld(true);
  // precise=true：逐顶点计算，避免旋转过的几何体 AABB 被放大
  const bbox = new THREE.Box3().setFromObject(obj, true);
  const center = bbox.getCenter(new THREE.Vector3());
  const wrapper = new THREE.Group();
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= bbox.min.y;
  wrapper.add(obj);
  return wrapper;
}

const exporter = new GLTFExporter();

export async function exportGLB(object3d, outFile) {
  const scene = new THREE.Scene();
  scene.add(normalize(object3d));
  const buffer = await exporter.parseAsync(scene, {
    binary: true,
    onlyVisible: true,
    maxTextureSize: 1024,
  });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, Buffer.from(buffer));
  return fs.statSync(outFile).size;
}

/** 统计一个对象的三角面数 */
export function triCount(obj) {
  let n = 0;
  obj.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry;
      n += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    }
  });
  return Math.round(n);
}
