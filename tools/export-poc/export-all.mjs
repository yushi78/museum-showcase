/**
 * 批量导出 31 件真实展品 GLB
 * 启动导出服务器 + Edge，访问 export-all.html 并触发导出
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const NODE = 'C:/Users/19437/.workbuddy/binaries/node/versions/22.22.2/node.exe';
const URL_ = 'http://127.0.0.1:8788/export-all.html';
const CDP_PORT = 9335;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe']
  .find((p) => fs.existsSync(p));

if (!EDGE) { console.error('未找到 Edge'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. 启动导出服务器
const server = spawn(NODE, ['tools/export-poc/server.mjs'], {
  cwd: path.resolve(import.meta.dirname, '../..'),
  stdio: 'pipe',
});
let serverReady = false;
server.stdout.on('data', (d) => {
  const s = d.toString();
  process.stdout.write('[server] ' + s);
  if (s.includes('listening')) serverReady = true;
});
server.stderr.on('data', (d) => process.stderr.write('[server] ' + d.toString()));

for (let i = 0; i < 30; i++) {
  if (serverReady) break;
  await sleep(200);
}
if (!serverReady) { console.error('服务器未就绪'); server.kill(); process.exit(1); }

// 2. 启动 Edge
const profile = path.join(os.tmpdir(), 'edge-export-all-' + CDP_PORT + '-' + Date.now());

const edge = spawn(EDGE, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${profile}`,
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  '--disable-web-security',
  URL_,
], { stdio: 'ignore' });

async function getPage() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`).then((r) => r.json());
      const page = list.find((p) => p.type === 'page');
      if (page) return page;
    } catch {}
    await sleep(500);
  }
  throw new Error('无法连接到 Edge CDP');
}

async function run() {
  const page = await getPage();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let seq = 0;
  const waiters = new Map();
  let lastLog = '';
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const txt = msg.params.args.map((a) => a.value || a.description || '').join(' ');
      lastLog = txt;
      process.stdout.write(`\r[log] ${txt.slice(-100)}`);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('\n[exception]', JSON.stringify(msg.params.exceptionDetails));
    }
    if (msg.id && waiters.has(msg.id)) {
      waiters.get(msg.id)(msg.error ? Promise.reject(new Error(JSON.stringify(msg.error))) : msg.result);
      waiters.delete(msg.id);
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq;
    waiters.set(id, (v) => (v instanceof Error ? rej(v) : res(v)));
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await sleep(1500);

  console.log('\n触发批量导出...');
  send('Runtime.evaluate', {
    expression: 'window.exportAll().then(()=>"DONE").catch(e=>"ERR:"+e.message)',
    awaitPromise: true,
    returnByValue: true,
  }).then((r) => console.log('\nexportAll 返回:', JSON.stringify(r))).catch((e) => console.error('\nexportAll 失败:', e));

  // 轮询日志，等待完成
  for (let i = 0; i < 600; i++) {
    await sleep(2000);
    const out = await send('Runtime.evaluate', { expression: 'document.getElementById("log")?.textContent || ""' });
    const txt = out?.result?.value || '';
    const last = txt.split('\n').slice(-2).join(' | ').slice(-120);
    process.stdout.write(`\r[${i*2}s] ${last || lastLog.slice(-100)}`);
    if (txt.includes('完成：')) break;
  }
  console.log('\n');

  ws.close();
}

try {
  await run();
} catch (e) {
  console.error('RUN ERROR:', e);
} finally {
  edge.kill();
  server.kill();
}

// 统计生成结果
const modelDir = path.resolve('site/models');
const files = fs.readdirSync(modelDir).filter((f) => f.endsWith('.glb') && f !== 'poc-textured-box.glb');
const totalSize = files.reduce((a, f) => a + fs.statSync(path.join(modelDir, f)).size, 0);
console.log(`已生成 GLB: ${files.length} 个，合计 ${(totalSize / 1048576).toFixed(2)} MB`);
