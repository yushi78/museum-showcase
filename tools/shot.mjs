/**
 * 无头浏览器实拍：驱动 Edge (CDP) 打开页面，收集控制台错误 / 失败请求，并截图。
 * 用法：node tools/shot.mjs <url> <out.png> [waitMs] [w] [h]
 * 依赖：仅 Node 内置 WebSocket（Node >= 22），不装任何 npm 包。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [, , URL_ = 'http://127.0.0.1:8777/', OUT = 'shot.png', WAIT = '9000', W = '1440', H = '900'] = process.argv;
const PORT = 9333 + (Number(process.env.SHOT_SLOT) || 0);

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
if (!EDGE) { console.error('未找到 Edge'); process.exit(1); }

const profile = path.join(os.tmpdir(), 'shot-profile-' + PORT);

const edge = spawn(EDGE, [
  '--headless=new',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + profile,
  '--window-size=' + W + ',' + H,
  '--hide-scrollbars',
  '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync',
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  '--ignore-gpu-blocklist',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 等待调试端口就绪 */
let target = null;
for (let i = 0; i < 60; i++) {
  await sleep(300);
  try {
    const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
    target = list.find((t) => t.type === 'page');
    if (target) break;
  } catch { /* 端口未起 */ }
}
if (!target) { edge.kill(); console.error('调试端口未就绪'); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let seq = 0;
const waiters = new Map();
const errors = [];
const failed = [];
const logs = [];

ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && waiters.has(m.id)) { waiters.get(m.id)(m.result ?? m.error); waiters.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    errors.push((d.exception?.description || d.text || '').split('\n').slice(0, 3).join(' | '));
  }
  if (m.method === 'Runtime.consoleAPICalled') {
    const txt = m.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ');
    if (m.params.type === 'error') errors.push('console.error: ' + txt);
    else if (m.params.type === 'warning') logs.push('warn: ' + txt);
    else logs.push(m.params.type + ': ' + txt);
  }
  if (m.method === 'Network.loadingFailed') failed.push(m.params.errorText + ' ' + (m.params.type || ''));
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) {
    failed.push(m.params.response.status + ' ' + m.params.response.url);
  }
};

const send = (method, params = {}) =>
  new Promise((r) => { const id = ++seq; waiters.set(id, r); ws.send(JSON.stringify({ id, method, params })); });

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Network.clearBrowserCache');
await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });

await send('Page.navigate', { url: URL_ });
await sleep(+WAIT);

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
if (shot?.data) {
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('截图已保存 →', OUT);
} else {
  console.error('截图失败', shot);
}

/* 顺带把页面里的关键状态取回来 */
const probe = await send('Runtime.evaluate', {
  expression: `JSON.stringify({
    title: document.title,
    loaderGone: !!document.querySelector('#loader.gone'),
    listItems: document.querySelectorAll('#list li').length,
    hallCards: document.querySelectorAll('.hall-card').length,
    exCards: document.querySelectorAll('.ex-card').length,
    planSlots: document.querySelectorAll('#planSvg .plan-slot').length,
    loadText: document.querySelector('#loadText')?.textContent || null
  })`,
  returnByValue: true,
});
console.log('页面状态:', probe?.result?.value || '(无)');

console.log('控制台错误:', errors.length ? '\n  - ' + [...new Set(errors)].join('\n  - ') : '无');
console.log('失败请求:', failed.length ? '\n  - ' + [...new Set(failed)].join('\n  - ') : '无');
if (process.env.SHOT_VERBOSE) console.log('日志:\n  ' + logs.slice(0, 40).join('\n  '));

ws.close();
edge.kill();
setTimeout(() => process.exit(errors.length || failed.length ? 2 : 0), 400);
