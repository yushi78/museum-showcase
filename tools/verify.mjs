/**
 * 交付前自检：
 *  1. 展品 id ↔ GLB 文件名一一对应
 *  2. GLB 文件头合法（glTF magic + version 2）
 *  3. 每个展厅的槽位分配结果（是否有展品没上台 / 槽位空置）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');

const data = await import(pathToFileURL(path.join(SITE, 'js', 'data.js')).href);
const { assignSlots } = await import(pathToFileURL(path.join(SITE, 'js', 'slots.js')).href);
const { TEMPLATES, HALLS, EXHIBITS, exhibitsOf } = data;

let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  OK   ' : '  FAIL ') + msg); };

/* ---- 1. 展品 ↔ GLB ---- */
console.log('\n[1] 展品与 GLB 文件对应');
const dir = path.join(SITE, 'models');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.glb'));
const fset = new Set(files.map((f) => f.replace(/\.glb$/, '')));
const ids = EXHIBITS.map((e) => e.id);

const missing = ids.filter((i) => !fset.has(i));
const orphan = [...fset].filter((f) => !ids.includes(f));
say(missing.length === 0, `缺失 GLB：${missing.length ? missing.join(', ') : '无'}`);
say(orphan.length === 0, `多余 GLB：${orphan.length ? orphan.join(', ') : '无'}`);
console.log(`  展品 ${ids.length} 件 / GLB ${files.length} 个`);

/* ---- 2. GLB 头校验 ---- */
console.log('\n[2] GLB 二进制头校验');
let totalBytes = 0;
let headBad = [];
for (const id of ids) {
  const f = path.join(dir, id + '.glb');
  if (!fs.existsSync(f)) { headBad.push(id + '(缺失)'); continue; }
  const fd = fs.openSync(f, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  const magic = buf.toString('ascii', 0, 4);
  const ver = buf.readUInt32LE(4);
  const len = buf.readUInt32LE(8);
  const real = fs.statSync(f).size;
  totalBytes += real;
  if (magic !== 'glTF' || ver !== 2 || len !== real) headBad.push(`${id}(magic=${magic},ver=${ver},len=${len}/${real})`);
}
say(headBad.length === 0, `文件头异常：${headBad.length ? headBad.join(', ') : '无'}`);
console.log(`  合计 ${(totalBytes / 1048576).toFixed(2)} MB`);

/* ---- 3. 槽位分配 ---- */
console.log('\n[3] 各展厅槽位分配');
for (const h of HALLS) {
  const tpl = TEMPLATES[h.template];
  const list = exhibitsOf(h.id);
  const { pairs, idleSlots } = assignSlots(tpl, list);
  const placed = new Set(pairs.map((p) => p.exhibit.id));
  const unplaced = list.filter((e) => !placed.has(e.id));

  console.log(`\n  ── ${h.name}（${tpl.name}） 展品 ${list.length} / 槽位 ${tpl.slots.length}`);
  say(unplaced.length === 0, `未上台展品：${unplaced.length ? unplaced.map((e) => e.name).join('、') : '无'}`);
  console.log(`  空置槽位：${idleSlots.length ? idleSlots.map((s) => s.id).join(', ') : '无'}`);

  // tier 错配统计
  const off = pairs.filter((p) => p.slot.tier !== p.exhibit.tier);
  if (off.length) {
    console.log(`  跨 tier 补位 ${off.length} 件：`);
    for (const p of off) {
      const fits = Math.min(p.slot.fp[0], p.slot.fp[1]) >= p.exhibit.size * 0.55;
      console.log(`    · ${p.exhibit.name}(t${p.exhibit.tier}, ${p.exhibit.size}m) → ${p.slot.id}(t${p.slot.tier}, 台面 ${p.slot.fp.join('×')}m) ${fits ? '台面足够' : '⚠ 会被缩小'}`);
    }
  }
}

console.log('\n' + (bad === 0 ? '全部通过 ✔' : `${bad} 项未通过 ✘`));
process.exitCode = bad === 0 ? 0 : 1;
