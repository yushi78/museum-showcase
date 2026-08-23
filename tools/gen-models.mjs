/**
 * 批量生成所有展品的 .glb 文件
 * 运行： node tools/gen-models.mjs
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { exportGLB, triCount, THREE } from './lib/kit.mjs';
import { MODERN } from './models/modern.mjs';
import { CLASSICAL } from './models/classical.mjs';
import { NATURAL } from './models/natural.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../site/models');

const ALL = [
  ['modern', MODERN],
  ['classical', CLASSICAL],
  ['natural', NATURAL],
];

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));

fs.mkdirSync(OUT, { recursive: true });

let totalBytes = 0;
let totalTris = 0;
const report = [];
const failures = [];

for (const [hall, table] of ALL) {
  for (const [id, factory] of Object.entries(table)) {
    if (only.length && !only.includes(id) && !only.includes(hall)) continue;
    const t0 = Date.now();
    try {
      const obj = factory();
      const tris = triCount(obj);
      const bbox = new THREE.Box3().setFromObject(obj, true);
      const size = bbox.getSize(new THREE.Vector3());
      const bytes = await exportGLB(obj, path.join(OUT, `${id}.glb`));
      totalBytes += bytes;
      totalTris += tris;
      report.push({
        hall, id, tris, kb: +(bytes / 1024).toFixed(1),
        size: [size.x, size.y, size.z].map((v) => +v.toFixed(2)).join(' × '),
        ms: Date.now() - t0,
      });
      process.stdout.write(
        `✓ ${hall.padEnd(9)} ${id.padEnd(24)} ${String(tris).padStart(7)} tri  ` +
        `${String((bytes / 1024).toFixed(1)).padStart(8)} KB  ${[size.x, size.y, size.z].map((v) => v.toFixed(2)).join('×')} m\n`
      );
    } catch (err) {
      failures.push({ id, err: err.message });
      process.stdout.write(`✗ ${hall.padEnd(9)} ${id.padEnd(24)} FAILED: ${err.message}\n`);
    }
  }
}

console.log('\n' + '─'.repeat(78));
console.log(`共 ${report.length} 件展品 | 总三角面 ${totalTris.toLocaleString()} | 总体积 ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
if (failures.length) {
  console.log(`\n失败 ${failures.length} 件：`);
  failures.forEach((f) => console.log(`  - ${f.id}: ${f.err}`));
  process.exitCode = 1;
}

fs.writeFileSync(path.join(__dirname, 'build-report.json'), JSON.stringify(report, null, 2));
