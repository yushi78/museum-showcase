/**
 * 展厅详情页
 * 渲染：展厅简介 → SVG 平面图（展台槽位 + 编号）→ 展品清单
 * 平面图与 3D 展厅共用 slots.js 的分配结果，编号一一对应。
 */
import { TEMPLATES, hallById, exhibitsOf, HALLS } from './data.js';
import { assignSlots } from './slots.js';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const hallId = params.get('hall') || 'modern';
const HALL = hallById(hallId);

if (!HALL) {
  location.replace('./index.html');
  throw new Error('unknown hall');
}

const TPL = TEMPLATES[HALL.template];
const LIST = exhibitsOf(hallId);
const { pairs, idleSlots } = assignSlots(TPL, LIST);

document.title = `${HALL.name} · 数字博物馆`;
document.documentElement.style.setProperty('--accent', HALL.theme);
$('#dHero').style.setProperty('--hc', HALL.theme);
document.body.style.setProperty('--hc', HALL.theme);

/* ---------------- Hero ---------------- */
$('#dEn').textContent = HALL.en;
$('#dName').textContent = HALL.name;
$('#dTag').textContent = HALL.tagline;
$('#dIntro').textContent = HALL.intro;
$('#dTags').innerHTML = HALL.highlights.map((t) => `<li class="chip">${t}</li>`).join('');
$('#dEnter').href = `./view.html?hall=${HALL.id}`;
$('#dTour').href = `./view.html?hall=${HALL.id}&mode=tour`;

const eras = [...new Set(LIST.map((e) => e.category))];
const tallest = LIST.reduce((a, b) => (b.size > a.size ? b : a), LIST[0]);
$('#dSpec').innerHTML = `
  <div><dt>建筑模板</dt><dd>${TPL.name}</dd></div>
  <div><dt>厅内尺度</dt><dd>${TPL.size.w} × ${TPL.size.d} m</dd></div>
  <div><dt>净高</dt><dd>${TPL.size.h} m</dd></div>
  <div><dt>展台 / 展品</dt><dd>${TPL.slots.length} / ${LIST.length}</dd></div>
  <div><dt>门类</dt><dd>${eras.length} 类</dd></div>
  <div><dt>最大展品</dt><dd>${tallest.size} m</dd></div>`;

/* ---------------- 平面图 ---------------- */
const STYLE_LABEL = { platform: '中央平台', plinth: '方柱展台', case: '玻璃展柜', niche: '壁龛展台' };
const STYLE_FILL = {
  platform: 'rgba(255,255,255,.16)',
  plinth: 'rgba(255,255,255,.12)',
  case: 'rgba(120,200,255,.15)',
  niche: 'rgba(255,255,255,.09)',
};

function drawPlan() {
  const svg = $('#planSvg');
  const VW = 800, VH = 500, PAD = 46;
  const { w, d } = TPL.size;
  const s = Math.min((VW - PAD * 2) / w, (VH - PAD * 2) / d);
  const cx = VW / 2, cy = VH / 2;
  const X = (x) => cx + x * s;
  const Y = (z) => cy + z * s;

  const seq = new Map(pairs.map((p, i) => [p.slot.id, { no: i + 1, ex: p.exhibit }]));
  const hw = (w / 2) * s, hd = (d / 2) * s;

  let g = '';

  // 地面 + 网格
  g += `<rect x="${cx - hw}" y="${cy - hd}" width="${hw * 2}" height="${hd * 2}" fill="#111820" stroke="none"/>`;
  g += '<g stroke="rgba(255,255,255,.05)" stroke-width="1">';
  for (let x = Math.ceil(-w / 2 / 4) * 4; x <= w / 2; x += 4) g += `<path d="M${X(x)} ${cy - hd}V${cy + hd}"/>`;
  for (let z = Math.ceil(-d / 2 / 4) * 4; z <= d / 2; z += 4) g += `<path d="M${cx - hw} ${Y(z)}H${cx + hw}"/>`;
  g += '</g>';

  // 墙体
  g += `<rect x="${cx - hw}" y="${cy - hd}" width="${hw * 2}" height="${hd * 2}"
        fill="none" stroke="${HALL.theme}" stroke-width="3" opacity=".65"/>`;

  // 入口（spawn 一侧）
  const sp = TPL.spawn.pos;
  g += `<g opacity=".9">
    <circle cx="${X(sp[0])}" cy="${Y(sp[1])}" r="9" fill="none" stroke="#4ecb84" stroke-width="2"/>
    <circle cx="${X(sp[0])}" cy="${Y(sp[1])}" r="3.2" fill="#4ecb84"/>
    <text x="${X(sp[0])}" y="${Y(sp[1]) + 26}" fill="#4ecb84" font-size="12" font-weight="600"
          text-anchor="middle" font-family="inherit">入口</text>
  </g>`;

  // 展台
  const cells = [];
  for (const slot of TPL.slots) {
    const [fw, fd] = slot.fp;
    const px = X(slot.pos[0]);
    const py = Y(slot.pos[1]);
    const ww = fw * s, dd = fd * s;
    const rot = (-(slot.face || 0) * 180) / Math.PI;
    const hitInfo = seq.get(slot.id);
    const filled = !!hitInfo;

    cells.push(`<g transform="translate(${px} ${py}) rotate(${rot.toFixed(2)})"
        class="plan-slot" data-id="${slot.id}">
      <rect x="${-ww / 2}" y="${-dd / 2}" width="${ww}" height="${dd}" rx="${Math.min(5, ww / 5)}"
            fill="${filled ? STYLE_FILL[slot.style] : 'rgba(255,255,255,.035)'}"
            stroke="${filled ? HALL.theme : 'rgba(255,255,255,.16)'}"
            stroke-width="${filled ? 2 : 1.2}"
            stroke-dasharray="${filled ? '' : '5 4'}"/>
      ${filled ? `<path d="M0 ${-dd / 2 - 2}V${-dd / 2 - 9}" stroke="${HALL.theme}" stroke-width="2" stroke-linecap="round" opacity=".7"/>` : ''}
    </g>`);

    if (filled) {
      // 编号气泡不跟随旋转，始终正向可读
      cells.push(`<g transform="translate(${px} ${py})">
        <circle r="13" fill="${HALL.theme}" opacity=".95"/>
        <text y="4.6" fill="#fff" font-size="13" font-weight="700" text-anchor="middle"
              font-family="inherit">${hitInfo.no}</text>
        <title>${hitInfo.no}. ${hitInfo.ex.name}（${STYLE_LABEL[slot.style]}）</title>
      </g>`);
    } else {
      cells.push(`<g transform="translate(${px} ${py})"><title>${slot.id} 空置</title>
        <text y="4" fill="rgba(255,255,255,.3)" font-size="11" text-anchor="middle" font-family="inherit">空</text></g>`);
    }
  }
  g += cells.join('');

  // 图例 + 比例尺
  const legend = [
    ['已布展台', HALL.theme, 'rgba(255,255,255,.16)'],
    ['空置槽位', 'rgba(255,255,255,.2)', 'rgba(255,255,255,.035)'],
  ];
  g += `<g transform="translate(${PAD - 24} ${VH - 22})" font-family="inherit">
    ${legend.map((l, i) => `<g transform="translate(${i * 118} 0)">
        <rect x="0" y="-9" width="16" height="12" rx="2.5" fill="${l[2]}" stroke="${l[1]}" stroke-width="1.6"/>
        <text x="23" y="1" fill="#8f9cae" font-size="11.5">${l[0]}</text>
      </g>`).join('')}
  </g>`;

  const barM = 5;
  g += `<g transform="translate(${VW - PAD - barM * s} ${VH - 26})" font-family="inherit">
    <path d="M0 0h${barM * s}M0 -5v10M${barM * s} -5v10" stroke="#8f9cae" stroke-width="1.4"/>
    <text x="${(barM * s) / 2}" y="-10" fill="#8f9cae" font-size="11" text-anchor="middle">${barM} m</text>
  </g>`;

  svg.innerHTML = g;
}
drawPlan();

/* ---------------- 展品清单 ---------------- */
const numOf = new Map(pairs.map((p, i) => [p.exhibit.id, { no: i + 1, slot: p.slot }]));

$('#exCount').textContent = `${LIST.length} 件`;
$('#exGrid').innerHTML = LIST.map((e) => {
  const info = numOf.get(e.id);
  const no = info ? String(info.no).padStart(2, '0') : '--';
  const where = info ? STYLE_LABEL[info.slot.style] : '待布展';
  return `<a class="ex-card" href="./view.html?hall=${HALL.id}&focus=${e.id}">
    <div class="ex-hd">
      <div>
        <h3>${e.name}</h3>
        <span class="ex-en">${e.en}</span>
      </div>
      <span class="ex-no">${no}</span>
    </div>
    <div class="ex-meta">
      <span>${e.era}</span><span>${e.material}</span><span>${where}</span>
    </div>
    <p class="ex-desc">${e.desc}</p>
  </a>`;
}).join('');

/* 平面图编号 ←→ 清单卡片 联动高亮 */
const cards = [...document.querySelectorAll('.ex-card')];
cards.forEach((card, i) => {
  const ex = LIST[i];
  const info = numOf.get(ex.id);
  if (!info) return;
  const node = $(`#planSvg .plan-slot[data-id="${info.slot.id}"] rect`);
  if (!node) return;
  card.addEventListener('mouseenter', () => { node.style.filter = 'brightness(2.2)'; node.style.strokeWidth = '3.4'; });
  card.addEventListener('mouseleave', () => { node.style.filter = ''; node.style.strokeWidth = ''; });
});

/* 空槽提示（开发自检用，不打扰用户） */
if (idleSlots.length) console.info('[hall] 空置槽位：', idleSlots.map((s) => s.id).join(', '));

/* 底部导航：切换到其他展厅 */
const others = HALLS.filter((h) => h.id !== HALL.id);
const foot = document.querySelector('.foot');
foot.insertAdjacentHTML(
  'afterbegin',
  `<span style="margin-right:auto">其他展厅：${others
    .map((h) => `<a href="./hall.html?hall=${h.id}" style="color:${h.theme};font-weight:600">${h.name}</a>`)
    .join(' · ')}</span>`
);
