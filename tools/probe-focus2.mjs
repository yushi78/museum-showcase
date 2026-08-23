import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const URL_ = 'http://127.0.0.1:8777/view.html?hall=classical&focus=jade-seal&mode=top';
const PORT = 9555;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p));
const profile = path.join(os.tmpdir(), 'probe2-profile-' + PORT);
const edge = spawn(EDGE, ['--headless=new','--remote-debugging-port='+PORT,'--user-data-dir='+profile,'--enable-unsafe-swiftshader','--use-angle=swiftshader','about:blank'], {stdio:'ignore'});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let target;
for(let i=0;i<60;i++){await sleep(300);try{const list=await fetch('http://127.0.0.1:'+PORT+'/json/list').then(r=>r.json());target=list.find(t=>t.type==='page');if(target)break;}catch{}}
if(!target){edge.kill();process.exit(1);}
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r=>(ws.onopen=r));
let seq=0; const waiters=new Map();
ws.onmessage=(ev)=>{const m=JSON.parse(ev.data);if(m.id&&waiters.has(m.id)){waiters.get(m.id)(m.result??m.error);waiters.delete(m.id);}};
const send=(method,params={})=>new Promise(r=>{const id=++seq;waiters.set(id,r);ws.send(JSON.stringify({id,method,params}));});
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
await send('Page.navigate',{url:URL_});await sleep(26000);
const out=await send('Runtime.evaluate',{expression:`JSON.stringify({lastFocus:window.__lastFocus, panelOpen:!!document.querySelector('#panel.open')})`,returnByValue:true});
console.log(out?.result?.value);
ws.close();edge.kill();
