/**
 * 用 Node 22 内置 WebSocket + 子进程驱动 Edge 完成浏览器内 GLB 导出 PoC
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const URL_ = 'http://127.0.0.1:8788/export.html';
const CDP_PORT = 9333;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe']
  .find((p) => fs.existsSync(p));

if (!EDGE) { console.error('未找到 Edge'); process.exit(1); }

const profile = path.join(os.tmpdir(), 'edge-export-poc-' + CDP_PORT);
fs.rmSync(profile, { recursive: true, force: true });

const edge = spawn(EDGE, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${profile}`,
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  URL_,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function main() {
  const page = await getPage();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let seq = 0;
  const waiters = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
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
  await send('Runtime.evaluate', { expression: 'document.getElementById("run").click()' });

  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    const out = await send('Runtime.evaluate', { expression: 'document.getElementById("log").textContent' });
    const txt = out?.result?.value || '';
    process.stdout.write(`\r[${i}] ${txt.slice(-80).replace(/\n/g, ' | ')}`);
    if (txt.includes('上传成功') || txt.includes('ERROR')) break;
  }
  console.log('');

  ws.close();
  edge.kill();

  const file = path.resolve('site/models/poc-textured-box.glb');
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file);
    console.log('✓ GLB 已生成:', file, (stat.size / 1024).toFixed(1), 'KB');
  } else {
    console.error('✗ GLB 未生成');
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); edge.kill(); process.exit(1); });
