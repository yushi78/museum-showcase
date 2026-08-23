/**
 * 布局落地自检：在 Node 中真实解析每个 GLB，复算布局引擎的缩放/吸附结果，
 * 输出每件展品上台后的实际尺寸，检查是否被台面或净高压得过小。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Node 环境无 DOM，GLTFLoader 解码贴图会崩。
 * 校验只关心几何包围盒 —— 解析前把 GLB 的 JSON 块里所有贴图引用剥掉。
 */
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

  const rest = buf.subarray(20 + jsonLen);            // BIN 块（含其 12 字节头）
  const total = 12 + 8 + out.length + rest.length;
  const res = new Uint8Array(total);
  const rv = new DataView(res.buffer);
  rv.setUint32(0, 0x46546c67, true); rv.setUint32(4, 2, true); rv.setUint32(8, total, true);
  rv.setUint32(12, out.length, true); rv.setUint32(16, 0x4e4f534a, true);
  res.set(out, 20); res.set(rest, 20 + out.length);
  return res;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');

const { TEMPLATES, HALLS, exhibitsOf } = await import(pathToFileURL(path.join(SITE, 'js', 'data.js')).href);
const { assignSlots } = await import(pathToFileURL(path.join(SITE, 'js', 'slots.js')).href);

const loader = new GLTFLoader();
const parse = (buf) =>
  new Promise((res, rej) => loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));

let warn = 0;
let meshTotal = 0;
let triTotal = 0;

for (const h of HALLS) {
  const tpl = TEMPLATES[h.template];
  const { pairs } = assignSlots(tpl, exhibitsOf(h.id));
  console.log(`\n══ ${h.name}  净高 ${tpl.size.h}m ` + '═'.repeat(30));
  console.log('  展品                    槽位      缩放    上台尺寸 (W×H×D m)      占台面');

  for (const { exhibit, slot } of pairs) {
    const file = path.join(SITE, 'models', exhibit.id + '.glb');
    const gltf = await parse(stripTextures(fs.readFileSync(file)));
    const scene = gltf.scene;

    let meshes = 0, tris = 0;
    scene.traverse((o) => {
      if (!o.isMesh) return;
      meshes++;
      const g = o.geometry;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    });
    meshTotal += meshes;
    triTotal += tris;

    // —— 与 layout.js 完全一致的算法 ——
    const raw = new THREE.Box3().setFromObject(scene, true);
    const dim = raw.getSize(new THREE.Vector3());
    const maxDim = Math.max(dim.x, dim.y, dim.z);
    const [fw, fd] = slot.fp;
    const headroom = slot.style === 'case' ? 1.0 : tpl.size.h - slot.h - 1.2;

    let s = exhibit.size / maxDim;
    const sDeclared = s;
    s = Math.min(s, (fw * 0.88) / dim.x);
    s = Math.min(s, (fd * 0.88) / dim.z);
    s = Math.min(s, headroom / dim.y);

    const W = dim.x * s, H = dim.y * s, D = dim.z * s;
    const useW = (W / fw) * 100, useD = (D / fd) * 100;
    const shrink = s / sDeclared;

    const flags = [];
    if (shrink < 0.6) flags.push(`⚠ 被压到声明尺寸的 ${(shrink * 100).toFixed(0)}%`);
    if (Math.max(useW, useD) > 95) flags.push('⚠ 几乎占满台面');
    if (H < 0.12) flags.push('⚠ 过小难以看清');
    if (flags.length) warn++;

    const pad = (str, n) => String(str) + ' '.repeat(Math.max(0, n - [...String(str)].reduce((a, c) => a + (c.charCodeAt(0) > 127 ? 2 : 1), 0)));
    console.log(
      `  ${pad(exhibit.name, 22)}${pad(slot.id, 10)}${pad(s.toFixed(3), 8)}` +
      `${pad(`${W.toFixed(2)}×${H.toFixed(2)}×${D.toFixed(2)}`, 24)}${pad(Math.max(useW, useD).toFixed(0) + '%', 7)}` +
      (flags.length ? '  ' + flags.join(' ') : '')
    );
  }
}

console.log(`\n合计 ${meshTotal} 个 mesh / ${triTotal.toLocaleString()} 三角面`);
console.log(warn === 0 ? '布局全部合理 ✔' : `${warn} 件展品有尺寸提示（见上）`);
