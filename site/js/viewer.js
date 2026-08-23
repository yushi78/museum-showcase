/**
 * 3D 展厅主程序
 * 模式：漫游 (WASD + 鼠标) / 俯瞰 (轨道) / 导览 (路点巡游)
 */
import * as THREE from 'three';
import { OrbitControls } from '../vendor/jsm/controls/OrbitControls.js';
import { TEMPLATES, hallById, exhibitsOf } from './data.js';
import { buildHall, buildLighting } from './hall-builder.js';
import { placeExhibits, setHighlight, buildTourRoute } from './layout.js';
import { RoamControls, TourController, bindJoystick } from './controls.js';

/* ---------------- 基础 ---------------- */
const params = new URLSearchParams(location.search);
const hallId = params.get('hall') || 'modern';
const HALL = hallById(hallId);
if (!HALL) location.replace('./index.html');

const TPL = TEMPLATES[HALL.template];
const EXHIBITS = exhibitsOf(hallId);
const $ = (s) => document.querySelector(s);

document.documentElement.style.setProperty('--accent', HALL.theme);
$('#hallName').textContent = HALL.name;
$('#hallTpl').textContent = TPL.name;
$('#hallCount').textContent = EXHIBITS.length;

/* ---------------- 渲染器 / 场景 ---------------- */
const canvas = $('#stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(TPL.palette.fog);
scene.fog = new THREE.Fog(TPL.palette.fog, TPL.size.w * 0.9, TPL.size.w * 2.4);

/* 柔和环境光照：用渐变等距贴图经 PMREM 生成，让金属呈柔和反射而非刺眼高光，
   同时整体抬亮展厅、减少暗部死黑 */
function buildEnvironment(renderer, tpl) {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 256;
  const ctx = c.getContext('2d');
  // 中性柔光渐变：避免给金属/玉器带来明显偏色
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, '#e8eaed');
  g.addColorStop(0.45, '#9da3ab');
  g.addColorStop(1.0, '#565550');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose(); pmrem.dispose();
  return env;
}
scene.environment = buildEnvironment(renderer, TPL);
scene.environmentIntensity = 0.45;

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.08, 400);
camera.position.set(TPL.spawn.pos[0], 1.62, TPL.spawn.pos[1]);

const hall = buildHall(TPL);
scene.add(hall.root);
buildLighting(TPL, hall, scene);

/* ---------------- 控制器 ---------------- */
const roam = new RoamControls(camera, canvas, {
  colliders: hall.colliders,
  bounds: { w: TPL.size.w, d: TPL.size.d },
  spawn: TPL.spawn,
});
roam.onLockChange = (locked) => {
  $('#crosshair').style.display = locked && mode === 'roam' ? 'block' : 'none';
  $('#lockHint').classList.toggle('hide', locked || mode !== 'roam');
};

const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true;
orbit.dampingFactor = 0.075;
orbit.maxPolarAngle = 1.44;
orbit.minDistance = 6;
orbit.maxDistance = Math.max(TPL.size.w, TPL.size.d) * 1.5;
orbit.enabled = false;
orbit.target.set(0, 1.2, 0);

let tour = null;
let records = [], pickTargets = [], byId = new Map();

/* ---------------- 加载展品 ---------------- */
const bar = $('#barFill'), loadTxt = $('#loadText');

placeExhibits({
  tpl: TPL, hall, exhibits: EXHIBITS, accent: HALL.theme,
  onProgress: (done, total, name) => {
    bar.style.width = (done / total * 100).toFixed(1) + '%';
    loadTxt.textContent = `正在布置展品 ${done}/${total} · ${name}`;
  },
}).then((res) => {
  records = res.records;
  pickTargets = res.pickTargets;
  byId = new Map(records.map((r) => [r.exhibit.id, r]));

  tour = new TourController(camera, buildTourRoute(records, TPL), { dwell: 5.2, travel: 3.0 });
  tour.onFocus = (w) => { $('#tourNow').textContent = w.exhibit.name; };
  tour.onArrive = (w) => { select(byId.get(w.exhibit.id), false); };

  buildList();
  drawMinimap();
  $('#loader').classList.add('gone');

  /* 入口参数：?mode=roam|top|tour&focus=<exhibitId> */
  const wantFocus = params.get('focus');
  const wantMode = params.get('mode');
  const target = wantFocus ? byId.get(wantFocus) : null;

  if (target) {
    // 指定展品：默认用俯瞰起步再飞过去，视角变化看得清楚
    setMode(['roam', 'top', 'tour'].includes(wantMode) ? wantMode : 'top');
    if (mode === 'tour') {
      const i = records.indexOf(target);
      if (i >= 0) tour.goto(i);
      select(target, false);
    } else {
      setTimeout(() => select(target, true), 380);
    }
  } else {
    setMode(['roam', 'top', 'tour'].includes(wantMode) ? wantMode : 'roam');
  }
});

/* ==================================================================== */
/* 模式切换                                                              */
/* ==================================================================== */
let mode = 'roam';

function setMode(m) {
  mode = m;
  document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  $('#tourBar').classList.toggle('hide', m !== 'tour');
  $('#roamHelp').classList.toggle('hide', m !== 'roam');
  $('#joy').classList.toggle('hide', !(m === 'roam' && isTouch));
  $('#lockHint').classList.toggle('hide', m !== 'roam');
  $('#crosshair').style.display = 'none';

  roam.setEnabled(false);
  orbit.enabled = false;
  tour?.stop();

  if (m === 'roam') {
    roam.setEnabled(true);
    roam.adoptFrom(camera);
    canvas.style.cursor = 'grab';
  } else if (m === 'top') {
    orbit.enabled = true;
    const R = Math.max(TPL.size.w, TPL.size.d) * 0.62;
    animateCam(new THREE.Vector3(0, Math.max(TPL.size.h * 1.5, 16), R), new THREE.Vector3(0, 1.0, 0), 900, () => {
      orbit.target.set(0, 1.0, 0); orbit.update();
    });
    canvas.style.cursor = 'default';
  } else if (m === 'tour') {
    tour?.start(camera, Math.max(0, tour.index));
    canvas.style.cursor = 'default';
  }
}
document.querySelectorAll('.mode-btn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

/* 相机补间（模式切换 / 聚焦用） */
let camTween = null;
function animateCam(eye, look, ms, done) {
  const p0 = camera.position.clone();
  const l0 = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).multiplyScalar(5).add(p0);
  camTween = { p0, l0, p1: eye.clone(), l1: look.clone(), t: 0, ms, done };
}
function stepTween(dt) {
  if (!camTween) return false;
  camTween.t += (dt * 1000) / camTween.ms;
  const k = Math.min(1, camTween.t);
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  camera.position.copy(camTween.p0).lerp(camTween.p1, e);
  camera.lookAt(camTween.l0.clone().lerp(camTween.l1, e));
  if (k >= 1) { const d = camTween.done; camTween = null; d?.(); }
  return true;
}

/* ==================================================================== */
/* 拾取与信息面板                                                        */
/* ==================================================================== */
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
let hovered = null, selected = null;
const isTouch = matchMedia('(hover: none)').matches;

function pickAt(nx, ny) {
  ptr.set(nx, ny);
  ray.setFromCamera(ptr, camera);
  const hits = ray.intersectObjects(pickTargets, false);
  if (!hits.length) return null;
  return byId.get(hits[0].object.userData.exhibitId) || null;
}

function hover(rec) {
  if (hovered === rec) return;
  if (hovered && hovered !== selected) setHighlight(hovered, false);
  hovered = rec;
  if (rec && rec !== selected) setHighlight(rec, true, new THREE.Color(HALL.theme).getHex());
  const tip = $('#tip');
  if (rec) { tip.textContent = rec.exhibit.name; tip.classList.remove('hide'); }
  else tip.classList.add('hide');
  if (mode !== 'roam' || !roam.locked) canvas.style.cursor = rec ? 'pointer' : (mode === 'roam' ? 'grab' : 'default');
}

function select(rec, fly = true) {
  if (selected && selected !== rec) setHighlight(selected, false);
  selected = rec;
  if (!rec) { $('#panel').classList.remove('open'); return; }
  setHighlight(rec, true, new THREE.Color(HALL.theme).getHex());

  const e = rec.exhibit;
  $('#pTitle').textContent = e.name;
  $('#pEn').textContent = e.en;
  $('#pCat').textContent = e.category;
  $('#pEra').textContent = e.era;
  $('#pMat').textContent = e.material;
  $('#pDesc').textContent = e.desc;
  $('#pFacts').innerHTML = e.facts.map(([k, v]) => `<div class="fact"><span>${k}</span><b>${v}</b></div>`).join('');
  $('#pSlot').textContent = `${rec.slot.id} · ${slotName(rec.slot.style)} · 实际尺寸 ${fmt(rec.size)}`;
  $('#panel').classList.add('open');
  document.querySelectorAll('#list li').forEach((li) => li.classList.toggle('on', li.dataset.id === e.id));

  if (fly) focusOn(rec);
  drawMinimap();
}
const fmt = (v) => `${v.x.toFixed(2)} × ${v.y.toFixed(2)} × ${v.z.toFixed(2)} m`;
const slotName = (s) => ({ platform: '中央平台', plinth: '方柱展台', case: '玻璃展柜', niche: '壁龛展台' }[s] || s);

function focusOn(rec) {
  const aisleHalf = Math.abs(rec.slot.pos[1]);
  const minDist = Math.max(2.6, aisleHalf * 0.72 + 1.0);
  const dist = Math.max(minDist, rec.radius * 2.5 + 1.2);
  const face = rec.slot.face || 0;
  const look = rec.center.clone();
  const eye = new THREE.Vector3(
    look.x + Math.sin(face) * dist,
    look.y + rec.size.y * 0.16 + 0.35,
    look.z + Math.cos(face) * dist
  );
  const hw = TPL.size.w / 2 - 1.1, hd = TPL.size.d / 2 - 1.1;
  eye.x = Math.max(-hw, Math.min(hw, eye.x));
  eye.z = Math.max(-hd, Math.min(hd, eye.z));

  if (mode === 'tour') { const i = records.indexOf(rec); if (i >= 0) tour.goto(i); return; }
  const wasOrbit = orbit.enabled;
  orbit.enabled = false;
  const prevRoam = roam.enabled;
  roam.setEnabled(false);
  animateCam(eye, look, 950, () => {
    if (wasOrbit) { orbit.target.copy(look); orbit.enabled = true; orbit.update(); }
    else if (prevRoam) { roam.setEnabled(true); roam.adoptFrom(camera); }
  });
}

$('#pClose').addEventListener('click', () => select(null));
$('#pFocus').addEventListener('click', () => selected && focusOn(selected));

/* 点击拾取（区分拖拽） */
let downP = null;
canvas.addEventListener('pointerdown', (e) => { downP = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', (e) => {
  if (!downP) return;
  const moved = Math.hypot(e.clientX - downP.x, e.clientY - downP.y);
  const quick = performance.now() - downP.t < 600;
  downP = null;
  if (moved > 7 || !quick) return;
  const rec = roam.locked
    ? pickAt(0, 0)
    : pickAt((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (rec) select(rec, false);
  else if (mode === 'roam' && !roam.locked && !isTouch) roam.requestLock();
  else select(null);
});

canvas.addEventListener('pointermove', (e) => {
  if (roam.locked) return;
  if (downP) return;
  hover(pickAt((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1));
  const tip = $('#tip');
  tip.style.left = e.clientX + 'px';
  tip.style.top = e.clientY + 'px';
});
canvas.addEventListener('pointerleave', () => hover(null));

/* ==================================================================== */
/* 展品列表                                                              */
/* ==================================================================== */
function buildList() {
  const ul = $('#list');
  ul.innerHTML = records.map((r) => `
    <li data-id="${r.exhibit.id}">
      <span class="idx">${String(records.indexOf(r) + 1).padStart(2, '0')}</span>
      <div><b>${r.exhibit.name}</b><i>${r.exhibit.era}</i></div>
    </li>`).join('');
  ul.querySelectorAll('li').forEach((li) => li.addEventListener('click', () => {
    const rec = byId.get(li.dataset.id);
    select(rec, true);
    if (innerWidth < 860) $('#side').classList.remove('open');
  }));
  $('#listCount').textContent = records.length;
}
$('#sideToggle').addEventListener('click', () => $('#side').classList.toggle('open'));

/* ==================================================================== */
/* 导览控制条                                                            */
/* ==================================================================== */
$('#tPrev').addEventListener('click', () => tour?.prev());
$('#tNext').addEventListener('click', () => tour?.next());
$('#tPlay').addEventListener('click', (e) => {
  const p = tour?.toggle();
  e.currentTarget.textContent = p ? '继续' : '暂停';
});

/* ==================================================================== */
/* 小地图                                                                */
/* ==================================================================== */
const mm = $('#minimap'), mc = mm.getContext('2d');
function mmScale() {
  const pad = 8;
  return Math.min((mm.width - pad * 2) / TPL.size.w, (mm.height - pad * 2) / TPL.size.d);
}
function w2m(x, z) {
  const s = mmScale();
  return [mm.width / 2 + x * s, mm.height / 2 + z * s];
}
function drawMinimap() {
  const s = mmScale();
  mc.clearRect(0, 0, mm.width, mm.height);
  mc.fillStyle = 'rgba(16,20,26,.72)';
  mc.fillRect(0, 0, mm.width, mm.height);
  // 房间
  mc.strokeStyle = 'rgba(255,255,255,.42)';
  mc.lineWidth = 1.5;
  mc.strokeRect(...w2m(-TPL.size.w / 2, -TPL.size.d / 2), TPL.size.w * s, TPL.size.d * s);
  // 展台
  TPL.slots.forEach((sl) => {
    const [mx, my] = w2m(sl.pos[0], sl.pos[1]);
    mc.fillStyle = 'rgba(255,255,255,.16)';
    mc.fillRect(mx - sl.fp[0] * s / 2, my - sl.fp[1] * s / 2, sl.fp[0] * s, sl.fp[1] * s);
  });
  // 展品点
  records.forEach((r) => {
    const [mx, my] = w2m(r.slot.pos[0], r.slot.pos[1]);
    mc.beginPath();
    mc.arc(mx, my, r === selected ? 5 : 3.2, 0, 7);
    mc.fillStyle = r === selected ? '#fff' : HALL.theme;
    mc.fill();
  });
  // 相机
  const [cx, cy] = w2m(camera.position.x, camera.position.z);
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const a = Math.atan2(dir.x, dir.z);
  mc.save();
  mc.translate(cx, cy); mc.rotate(-a);
  mc.beginPath(); mc.moveTo(0, -14); mc.lineTo(9, 9); mc.lineTo(0, 4); mc.lineTo(-9, 9); mc.closePath();
  mc.fillStyle = '#ffd76a'; mc.fill();
  mc.restore();
}
mm.addEventListener('click', (e) => {
  const r = mm.getBoundingClientRect();
  const px = (e.clientX - r.left) * (mm.width / r.width);
  const py = (e.clientY - r.top) * (mm.height / r.height);
  let best = null, bd = 1e9;
  records.forEach((rec) => {
    const [mx, my] = w2m(rec.slot.pos[0], rec.slot.pos[1]);
    const d = Math.hypot(mx - px, my - py);
    if (d < bd) { bd = d; best = rec; }
  });
  if (best && bd < 22) select(best, true);
});

/* ==================================================================== */
/* 移动端摇杆 / 快捷键                                                    */
/* ==================================================================== */
bindJoystick($('#joy'), (x, y) => { roam.touchMove.x = x; roam.touchMove.y = y; });

addEventListener('keydown', (e) => {
  if (e.code === 'Digit1') setMode('roam');
  if (e.code === 'Digit2') setMode('top');
  if (e.code === 'Digit3') setMode('tour');
  if (e.code === 'Escape') select(null);
  if (e.code === 'KeyL') $('#side').classList.toggle('open');
});

/* ==================================================================== */
/* 主循环                                                                */
/* ==================================================================== */
const clock = new THREE.Clock();
let mmTick = 0;

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, clock.getDelta());

  if (!stepTween(dt)) {
    if (mode === 'roam') roam.update(dt);
    else if (mode === 'top') orbit.update();
    else if (mode === 'tour') tour?.update(dt);
  }

  // 展签始终可读（朝向相机的水平分量）
  if ((mmTick += dt) > 0.06) {
    mmTick = 0;
    drawMinimap();
  }

  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
renderer.setSize(innerWidth, innerHeight);
tick();
