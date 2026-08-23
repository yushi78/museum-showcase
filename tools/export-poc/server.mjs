/**
 * 浏览器内 GLB 导出协调服务器
 * 工作原理：
 *   1. 起 HTTP 服务，把 site/ 映射到根路径，把 tools/refs/img/ 映射到 /refs/
 *   2. 提供 /export.html，该页面用 ES module + importmap 加载 three.js 与建模代码
 *   3. 页面建模完成后把 GLB ArrayBuffer POST 到 /upload/{id}
 *   4. Node 把二进制写入 site/models/{id}.glb
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { URL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SITE = path.join(ROOT, 'site');
const IMG = path.join(ROOT, 'tools/refs/img');
const MODELS = path.join(SITE, 'models');
const PORT = 8788;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.glb': 'model/gltf-binary',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function sanitize(p) {
  return p.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && pathname.startsWith('/upload/')) {
    const id = sanitize(pathname.slice('/upload/'.length));
    if (!id) {
      res.writeHead(400); res.end('bad id'); return;
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      const out = path.join(MODELS, `${id}.glb`);
      fs.writeFileSync(out, buf);
      console.log(`[upload] ${id}  ${(buf.length / 1024).toFixed(1)} KB -> ${out}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, id, bytes: buf.length, path: out }));
    });
    return;
  }

  // 静态文件
  let file;
  if (pathname.startsWith('/refs/')) {
    file = path.join(IMG, pathname.slice('/refs/'.length));
  } else if (pathname.startsWith('/tools/')) {
    file = path.join(ROOT, pathname);
  } else if (pathname === '/export.html' || pathname === '/export-all.html' || pathname === '/') {
    file = path.join(import.meta.dirname, pathname === '/' ? 'export-all.html' : path.basename(pathname));
  } else {
    file = path.join(SITE, pathname);
  }

  if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('404 ' + pathname);
    return;
  }

  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Export server listening on http://127.0.0.1:${PORT}/export.html`);
});
