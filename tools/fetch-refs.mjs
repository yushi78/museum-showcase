/**
 * 参考素材抓取管线
 * 从 The Met Collection API (CC0) 与 Wikimedia Commons API 下载真实展品图像。
 *
 *   node tools/fetch-refs.mjs            # 全量
 *   node tools/fetch-refs.mjs fang-ding  # 单件
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const REF_DIR = path.join(ROOT, 'tools', 'refs');
const IMG_DIR = path.join(REF_DIR, 'img');
const UA = 'MuseumShowcase/1.0 (educational 3D museum project; contact: local)';

fs.mkdirSync(IMG_DIR, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(REF_DIR, 'manifest.json'), 'utf8'));
const only = process.argv[2];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 带指数退避的重试。Wikimedia 对批量抓取会 429 / 直接断连，必须扛住。 */
async function withRetry(label, fn, tries = 5) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = Math.min(30000, 1500 * Math.pow(2, i)) + Math.random() * 800;
      if (i < tries - 1) {
        process.stdout.write(`   ↻ ${label} 第${i + 1}次失败(${e.message.slice(0, 40)})，${(wait / 1000).toFixed(1)}s 后重试\n`);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

async function getJSON(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json', 'Accept-Encoding': 'gzip' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'image/*,*/*', Referer: 'https://commons.wikimedia.org/' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) throw new Error('内容过小，疑似错误页');
  fs.writeFileSync(dest, buf);
  return buf.length;
}

/** Commons: 文件名 → 指定宽度的缩略图 URL + 许可元数据 */
async function commonsImage(file, width = 1600) {
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
    '&iiprop=url|size|extmetadata&iiurlwidth=' + width +
    '&titles=' + encodeURIComponent(file);
  const data = await getJSON(api);
  const pages = data?.query?.pages || {};
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) throw new Error('Commons 文件不存在: ' + file);
  const info = page.imageinfo?.[0];
  if (!info) throw new Error('无 imageinfo: ' + file);
  const meta = info.extmetadata || {};
  return {
    url: info.thumburl || info.url,
    origW: info.width,
    origH: info.height,
    license: meta.LicenseShortName?.value || '',
    artist: (meta.Artist?.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 120),
  };
}

/** Met: objectID → 主图 URL + 元数据 */
async function metImage(objectID) {
  const data = await getJSON(
    'https://collectionapi.metmuseum.org/public/collection/v1/objects/' + objectID
  );
  if (!data.primaryImage) throw new Error('Met 无主图: ' + objectID);
  return {
    url: data.primaryImage,
    small: data.primaryImageSmall,
    title: data.title,
    date: data.objectDate,
    medium: data.medium,
    dimensions: data.dimensions,
    isPD: data.isPublicDomain,
  };
}

const report = [];
let ok = 0, fail = 0, bytes = 0;

for (const ex of manifest.exhibits) {
  if (only && ex.id !== only) continue;
  if (!ex.refs?.length) {
    report.push({ id: ex.id, note: '无图源（程序化材质）', files: [] });
    console.log(`—  ${ex.id.padEnd(20)} 无图源，走程序化材质`);
    continue;
  }

  const files = [];
  for (let i = 0; i < ex.refs.length; i++) {
    const ref = ex.refs[i];
    const tag = `${ex.id}-${i}-${ref.role}`;

    // 断点续传：已下好的跳过
    const existing = fs.readdirSync(IMG_DIR).find((f) => f.startsWith(tag + '.'));
    if (existing && fs.statSync(path.join(IMG_DIR, existing)).size > 1024) {
      const size = fs.statSync(path.join(IMG_DIR, existing)).size;
      bytes += size; ok++;
      files.push({
        file: existing, role: ref.role, src: ref.src,
        origin: ref.src === 'commons' ? ref.file : 'Met objectID ' + ref.objectID,
        license: ref.license, credit: ref.credit, bytes: size, cached: true,
      });
      console.log(`·  ${tag.padEnd(30)} ${(size / 1024).toFixed(0).padStart(5)} KB  (已缓存)`);
      continue;
    }

    try {
      let info, ext, url;
      if (ref.src === 'commons') {
        info = await withRetry(tag + ' meta', () => commonsImage(ref.file, 1600));
        url = info.url;
      } else {
        info = await withRetry(tag + ' meta', () => metImage(ref.objectID));
        // Met 原图动辄数十 MB，优先用 web-large
        url = info.small || info.url;
      }
      ext = (url.match(/\.(jpe?g|png|gif|tiff?|webp)(\?|$)/i)?.[1] || 'jpg').toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
      const dest = path.join(IMG_DIR, `${tag}.${ext}`);
      const size = await withRetry(tag + ' dl', () => download(url, dest));
      bytes += size;
      ok++;
      files.push({
        file: path.basename(dest),
        role: ref.role,
        src: ref.src,
        origin: ref.src === 'commons' ? ref.file : 'Met objectID ' + ref.objectID,
        license: ref.src === 'commons' ? (info.license || ref.license) : 'CC0',
        credit: ref.credit,
        px: ref.src === 'commons' ? `${info.origW}x${info.origH} orig` : (info.dimensions || ''),
        bytes: size,
        url,
      });
      console.log(`✓  ${tag.padEnd(30)} ${(size / 1024).toFixed(0).padStart(5)} KB  ${path.basename(dest)}`);
    } catch (e) {
      fail++;
      console.log(`✗  ${tag.padEnd(30)} ${e.message}`);
      files.push({ role: ref.role, error: e.message, origin: ref.file || ref.objectID });
    }
    await sleep(900 + Math.random() * 600); // 限速，别把公共 API 打爆
  }
  report.push({ id: ex.id, name: ex.real?.name, files });
}

fs.writeFileSync(path.join(REF_DIR, 'fetch-report.json'), JSON.stringify(report, null, 2));

console.log('\n────────────────────────────────');
console.log(`成功 ${ok} 张 / 失败 ${fail} 张 / 合计 ${(bytes / 1048576).toFixed(2)} MB`);
console.log('明细写入 tools/refs/fetch-report.json');
