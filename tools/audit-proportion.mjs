/**
 * 比例审计：把每个 GLB 的原始包围盒长宽高比，与 manifest 中记录的实物尺寸比对，
 * 找出与实物原貌偏离过大的展品。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = path.join(ROOT, 'site', 'models');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'refs', 'manifest.json'), 'utf8'));

// 模型文件名 ← manifest id
const FILE = {
  'fang-ding': 'bronze-fangding', 'chicken-cup': 'chenghua-chicken-cup',
  'silver-ewer': 'tang-silver-ewer', 'trilobite': 'trilobite-fossil', 'evtol': 'evtol-aircraft',
};

function stripTextures(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const jsonLen = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(buf.subarray(20, 20 + jsonLen)));
  for (const m of json.materials || []) {
    const p = m.pbrMetallicRoughness;
    if (p) { delete p.baseColorTexture; delete p.metallicRoughnessTexture; }
    delete m.normalTexture; delete m.occlusionTexture; delete m.emissiveTexture;
  }
  delete json.images; delete json.textures; delete json.samplers;
  let out = new TextEncoder().encode(JSON.stringify(json));
  const pad = (4 - (out.length % 4)) % 4;
  if (pad) { const t = new Uint8Array(out.length + pad); t.set(out); t.fill(0x20, out.length); out = t; }
  const rest = buf.subarray(20 + jsonLen);
  const total = 12 + 8 + out.length + rest.length;
  const res = new Uint8Array(total);
  const rv = new DataView(res.buffer);
  rv.setUint32(0, 0x46546c67, true); rv.setUint32(4, 2, true); rv.setUint32(8, total, true);
  rv.setUint32(12, out.length, true); rv.setUint32(16, 0x4e4f534a, true);
  res.set(out, 20); res.set(rest, 20 + out.length);
  return res;
}

const loader = new GLTFLoader();
const parse = (buf) =>
  new Promise((res, rej) => loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));

// 实物参考：[宽, 高, 深] mm，null = 不做刚性校验
function realWHD(it) {
  const d = it.real.dims_mm || {};
  const m = it.real.dims_m || {};
  switch (it.id) {
    case 'fang-ding': return [d.mouth_l, d.h_total, d.mouth_w];
    case 'bianzhong': return [d.frame_long_w, d.frame_short_h, d.frame_short_w];
    case 'jade-cong': return [d.top_d, d.h, d.top_d];
    case 'oracle-bone': return [d.w, d.l, d.t];               // 竖立展示：长边沿 Y
    case 'greek-amphora': return [d.mouth_d * 1.6, d.h, d.mouth_d * 1.6];
    case 'yuan-blue-vase': return [d.max_belly_d, d.h, d.max_belly_d];
    case 'chicken-cup': return [d.mouth_d, d.h, d.mouth_d];
    case 'silver-ewer': return [185, 300, 185];               // 腹最大径 185，通高含盖钮 300
    case 'jade-imperial-seal': return [d.side, d.h, d.side];
    case 'dragon-robe': return [d.sleeve_span * 0.45, d.l, 100];
    case 'phoenix-crown': return [450, d.h_total, 280];       // 博鬓外展总宽约 450
    case 'mamenchisaurus': return [2200, m.hip_h * 1000 * 2.1, m.total_l * 1000];
    case 'mammoth': return [2000, m.shoulder_h * 1000 * 1.15, (m.body_l + 1.8) * 1000];
    case 'trilobite': return [d.l * 6, d.l * 1.2, d.w * 6];   // 石板横放，虫体长边沿 X
    case 'fish-fossil': return [d.slab_w, 40, d.slab_h];
    case 'petrified-wood': return [d.d, d.d, d.t];
    case 'meteorite': return [d.w, d.h, d.t];
    case 'basalt-columns': return [2400, 2100, 2200];
    case 'siberian-tiger': return [700, d.shoulder_h * 1.35, d.head_body_l + d.tail_l];
    case 'giant-panda': return [900, d.shoulder_h * 1.5, d.head_body_l];
    case 'golden-monkey': return [500, d.head_body_l * 1.15, d.head_body_l + d.tail_l];
    case 'specimen-jar': return [d.jar_d, d.jar_h, d.jar_d];
    case 'insect-case': return [d.drawer_w * 2.4, 300, d.drawer_d * 2.4];
    case 'concept-car': return [d.l, d.h, d.w];               // 车长沿 X 建模
    case 'evtol': return [d.w, d.h, d.l];
    case 'smart-watch': return [d.case_w, 220, 58];           // 含表带自然垂展的整表包围盒
    case 'ar-glasses': return [d.visor_w, d.visor_h * 1.9, d.band_d];
    case 'humanoid-robot': return [d.w, d.h, d.d * 1.6];
    case 'robot-dog': return [d.w, d.h, d.l];
    case 'printed-chair': return [d.d, d.h, d.w];             // 进深沿 X 建模
    case 'lattice-table': return [d.w, d.h, d.d];
    default: return null;
  }
}

const rows = [];
for (const it of manifest.exhibits) {
  const file = path.join(MODELS, (FILE[it.id] || it.id) + '.glb');
  if (!fs.existsSync(file)) { console.log('缺文件', it.id); continue; }
  const gltf = await parse(stripTextures(fs.readFileSync(file)));
  const b = new THREE.Box3().setFromObject(gltf.scene, true);
  const dim = b.getSize(new THREE.Vector3());
  const real = realWHD(it);
  if (!real || real.some((v) => !v)) { rows.push([it.id, dim, null, null]); continue; }

  // 归一到最长边比较
  const mm = Math.max(dim.x, dim.y, dim.z);
  const mr = Math.max(...real);
  const got = [dim.x / mm, dim.y / mm, dim.z / mm];
  const exp = real.map((v) => v / mr);
  const err = got.map((v, i) => Math.abs(v - exp[i]));
  rows.push([it.id, got, exp, Math.max(...err)]);
}

const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - [...String(s)].reduce((a, c) => a + (c.charCodeAt(0) > 127 ? 2 : 1), 0)));
console.log(pad('展品', 22) + pad('模型 W:H:D', 26) + pad('实物 W:H:D', 26) + '最大偏差');
let bad = 0;
for (const [id, got, exp, err] of rows) {
  const f = (a) => (Array.isArray(a) ? a.map((v) => (v.x !== undefined ? v : v).toFixed(2)).join(' : ') : '—');
  const g = Array.isArray(got) && got.x === undefined ? got.map((v) => v.toFixed(2)).join(' : ') : `${got.x?.toFixed(2)} : ${got.y?.toFixed(2)} : ${got.z?.toFixed(2)}`;
  const e = exp ? exp.map((v) => v.toFixed(2)).join(' : ') : '—';
  const flag = err === null ? '' : err > 0.22 ? `  ✗ ${err.toFixed(2)}` : err > 0.13 ? `  ⚠ ${err.toFixed(2)}` : `  ✔ ${err.toFixed(2)}`;
  if (err !== null && err > 0.22) bad++;
  console.log(pad(id, 22) + pad(g, 26) + pad(e, 26) + flag);
}
console.log(`\n严重偏离（>0.22）：${bad} 件`);
