/**
 * 一次调用：启动导出服务器 + 启动 Edge + 运行 PoC + 清理
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const NODE = 'C:/Users/19437/.workbuddy/binaries/node/versions/22.22.2/node.exe';
const URL_ = 'http://127.0.0.1:8788/export.html';
const CDP_PORT = 9334;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe']
  .find((p) => fs.existsSync(p));

console.log('poc-all start');

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

// 2. 启动 Edge（不删除旧 profile，避免触发安全删除拦截；用时间戳保证唯一）
const profile = path.join(os.tmpdir(), 'edge-export-poc-' + CDP_PORT + '-' + Date.now());

const edge = spawn(EDGE, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${profile}`,
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  URL_,
], { stdio: 'ignore' });

async function getPage() {
  for (let i = 0; i < 40; i++) {
    try {
      const url = `http://127.0.0.1:${CDP_PORT}/json/list`;
      const r = await fetch(url);
      const list = await r.json();
      const page = list.find((p) => p.type === 'page');
      if (page) { console.log('CDP page found'); return page; }
    } catch (e) { if (i % 5 === 0) console.log(`  CDP wait ${i}: ${e.message}`); }
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
  const logs = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push(msg.params.args.map((a) => a.value || a.description || '').join(' '));
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
  await sleep(800);

  // 截屏看页面
  await send('Page.captureScreenshot', { format: 'png' }).then((r) => {
    fs.writeFileSync('.probe/poc-page.png', Buffer.from(r.data, 'base64'));
    console.log('\n页面截图已保存 .probe/poc-page.png');
  }).catch(() => {});

  console.log('调用 window.exportModel()...');
  const clickRes = await send('Runtime.evaluate', {
    expression: 'window.exportModel().then(r=>"OK:"+JSON.stringify(r)).catch(e=>"ERR:"+e.message)',
    awaitPromise: true,
    returnByValue: true,
  });
  console.log('export result:', JSON.stringify(clickRes));

  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    const out = await send('Runtime.evaluate', { expression: 'document.getElementById("log").textContent' });
    const txt = out?.result?.value || '';
    process.stdout.write(`\r[${i}] ${txt.slice(-80).replace(/\n/g, ' | ')}`);
    if (txt.includes('上传成功') || txt.includes('ERROR')) break;
  }
  console.log('\nConsole logs:');
  logs.forEach((l) => console.log('  >', l));
  ws.close();
}

async function main() {
  console.log('进入 main');
  try {
    console.log('等待 Edge CDP...');
    await run();
  } catch (e) {
    console.error('RUN ERROR:', e);
  } finally {
    console.log('清理 Edge/Server...');
    edge.kill();
    server.kill();
  }

  const file = path.resolve('site/models/poc-textured-box.glb');
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file);
    console.log('✓ GLB 已生成:', file, (stat.size / 1024).toFixed(1), 'KB');
  } else {
    console.error('✗ GLB 未生成');
    process.exit(1);
  }
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
