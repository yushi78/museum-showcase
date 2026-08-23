/**
 * 首页：渲染三张展厅卡片
 * 卡片插画为内联 SVG，按展厅主题渐变生成，零外链
 */
import { HALLS, TEMPLATES, EXHIBITS, exhibitsOf } from './data.js';

const $ = (s) => document.querySelector(s);

/* -------- 每个展厅一张示意插画（纯 SVG） -------- */
function art(hall, i) {
  const [c0, c1, c2] = hall.gradient;
  const gid = `g${i}`;
  const sid = `s${i}`;
  let inner = '';

  if (hall.id === 'modern') {
    // 开放式大跨度：横梁 + 中央载具剪影 + 两翼展台
    inner = `
      <path d="M0 118h360" stroke="${c2}" stroke-width="1" opacity=".35"/>
      <g opacity=".5" stroke="${c2}" stroke-width="1.4" fill="none">
        <path d="M22 26h316M22 40h316"/>
        <path d="M56 26v14M124 26v14M192 26v14M260 26v14M328 26v14"/>
      </g>
      <g fill="${c2}" opacity=".22">
        <rect x="34" y="42" width="26" height="3" rx="1.5"/><rect x="150" y="42" width="60" height="3" rx="1.5"/>
        <rect x="300" y="42" width="26" height="3" rx="1.5"/>
      </g>
      <!-- 中央概念车 -->
      <g transform="translate(180 104)">
        <path d="M-62 0c4-16 16-26 30-29 12-3 34-3 48 1 12 4 22 12 28 22 3 5 2 8-4 8H-58c-5 0-6-1-4-2z" fill="${c2}" opacity=".9"/>
        <path d="M-30-27c8-11 18-16 30-16 13 0 22 6 29 16z" fill="#ffffff" opacity=".28"/>
        <circle cx="-34" cy="3" r="10" fill="#0a0d12" opacity=".85"/><circle cx="-34" cy="3" r="4.4" fill="${c2}"/>
        <circle cx="36" cy="3" r="10" fill="#0a0d12" opacity=".85"/><circle cx="36" cy="3" r="4.4" fill="${c2}"/>
      </g>
      <rect x="112" y="112" width="136" height="8" rx="3" fill="#fff" opacity=".13"/>
      <!-- 两翼 -->
      <g fill="#fff" opacity=".14">
        <rect x="26" y="86" width="34" height="30" rx="3"/><rect x="300" y="86" width="34" height="30" rx="3"/>
      </g>
      <g stroke="${c2}" stroke-width="1.6" fill="none" opacity=".85">
        <circle cx="43" cy="96" r="7"/><path d="M43 90v6l4 3"/>
        <path d="M310 104h14M310 98h14M312 92h10"/>
      </g>`;
  } else if (hall.id === 'classical') {
    // 长廊：列柱 + 中央鼎 + 编钟
    inner = `
      <path d="M0 120h360" stroke="${c2}" stroke-width="1" opacity=".4"/>
      <g fill="${c2}" opacity=".3">
        ${[26, 74, 286, 334].map((x) => `<rect x="${x}" y="30" width="14" height="86" rx="2"/><rect x="${x - 5}" y="26" width="24" height="6" rx="2"/><rect x="${x - 5}" y="112" width="24" height="7" rx="2"/>`).join('')}
      </g>
      <path d="M14 22h332" stroke="${c2}" stroke-width="3" opacity=".45"/>
      <path d="M100 22h160v10a12 12 0 01-12 12H112a12 12 0 01-12-12z" fill="${c2}" opacity=".16"/>
      <!-- 中央方鼎 -->
      <g transform="translate(180 100)">
        <rect x="-30" y="-40" width="60" height="34" rx="3" fill="${c2}" opacity=".92"/>
        <rect x="-30" y="-40" width="60" height="7" rx="2.5" fill="#fff" opacity=".22"/>
        <rect x="-24" y="-50" width="6" height="11" rx="2.5" fill="${c2}" opacity=".92"/>
        <rect x="18" y="-50" width="6" height="11" rx="2.5" fill="${c2}" opacity=".92"/>
        <rect x="-24" y="-6" width="8" height="20" rx="3" fill="${c2}" opacity=".8"/>
        <rect x="16" y="-6" width="8" height="20" rx="3" fill="${c2}" opacity=".8"/>
        <g fill="#0a0d12" opacity=".38">
          ${[-22, -8, 6, 20].map((x) => `<rect x="${x}" y="-27" width="7" height="7" rx="1"/>`).join('')}
        </g>
      </g>
      <rect x="140" y="114" width="80" height="7" rx="3" fill="#fff" opacity=".13"/>
      <!-- 编钟架 -->
      <g transform="translate(300 66)" opacity=".85">
        <path d="M-26 0h52" stroke="${c2}" stroke-width="3"/>
        ${[-18, -6, 6, 18].map((x, k) => `<path d="M${x - 4} 2h8l2 ${11 + k * 2}h-12z" fill="${c2}" opacity=".8"/>`).join('')}
      </g>
      <!-- 玉琮 -->
      <g transform="translate(60 94)" opacity=".9">
        <rect x="-11" y="-14" width="22" height="28" rx="2" fill="#9fd8c0" opacity=".55"/>
        <circle cx="0" cy="0" r="6" fill="#0a0d12" opacity=".5"/>
      </g>`;
  } else {
    // 穹顶：拱肋 + 蜥脚类骨架 + 化石
    inner = `
      <path d="M0 122h360" stroke="${c2}" stroke-width="1" opacity=".4"/>
      <g fill="none" stroke="${c2}" stroke-width="1.5" opacity=".45">
        <path d="M8 122A172 108 0 01352 122"/>
        <path d="M40 122A140 86 0 01320 122"/>
        <path d="M180 14v22M92 40l16 18M268 40l-16 18"/>
      </g>
      <g stroke="${c2}" stroke-width="1" opacity=".25">
        ${Array.from({ length: 9 }, (_, k) => `<path d="M${28 + k * 38} 122V${58 + Math.abs(4 - k) * 9}"/>`).join('')}
      </g>
      <!-- 蜥脚类骨架 -->
      <g transform="translate(178 96)" stroke="#e8e2d2" fill="none" stroke-linecap="round">
        <path d="M-118 -18c22-14 44-16 62-6" stroke-width="3.4" opacity=".92"/>
        <path d="M-56 -24c26-6 56-4 80 6" stroke-width="5" opacity=".95"/>
        <path d="M24 -18c26 10 48 16 72 24" stroke-width="3.2" opacity=".9"/>
        <g stroke-width="2.4" opacity=".72">
          ${[-46, -32, -18, -4, 10].map((x, k) => `<path d="M${x} -21v${13 + (k === 2 ? 5 : 0)}"/>`).join('')}
        </g>
        <path d="M-40 -8v26M-24 -6v28M6 -4v26M22 -2v24" stroke-width="3.4" opacity=".88"/>
        <path d="M-118 -18l-14-4 4 8z" fill="#e8e2d2" stroke="none" opacity=".9"/>
      </g>
      <rect x="84" y="116" width="180" height="8" rx="3" fill="#fff" opacity=".13"/>
      <!-- 陨石 / 标本柜 -->
      <g transform="translate(40 100)">
        <path d="M-13 4l-4-11 7-9 12-2 9 8-2 12-10 6z" fill="#6d6459" opacity=".9"/>
      </g>
      <g transform="translate(322 92)" opacity=".85">
        <rect x="-14" y="-16" width="28" height="34" rx="3" fill="#fff" opacity=".1" stroke="${c2}" stroke-width="1.2"/>
        <path d="M0-6l7 6-7 6-7-6z" fill="${c2}" opacity=".8"/>
      </g>`;
  }

  return `<svg viewBox="0 0 360 172" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c0}"/><stop offset="58%" stop-color="${c1}" stop-opacity=".82"/><stop offset="100%" stop-color="${c0}"/>
      </linearGradient>
      <radialGradient id="${sid}" cx="50%" cy="8%" r="82%">
        <stop offset="0%" stop-color="${c2}" stop-opacity=".38"/><stop offset="100%" stop-color="${c2}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="360" height="172" fill="url(#${gid})"/>
    <rect width="360" height="172" fill="url(#${sid})"/>
    ${inner}
    <rect y="140" width="360" height="32" fill="#0a0d12" opacity=".34"/>
  </svg>`;
}

/* -------- 渲染 -------- */
const grid = $('#hallGrid');
grid.innerHTML = HALLS.map((h, i) => {
  const list = exhibitsOf(h.id);
  const tpl = TEMPLATES[h.template];
  return `<article class="hall-card" style="--hc:${h.theme}">
    <div class="hc-art">
      ${art(h, i)}
      <span class="hc-badge">${tpl.name}</span>
    </div>
    <div class="hc-body">
      <div class="hc-en">${h.en}</div>
      <h3>${h.name}</h3>
      <p class="hc-tag">${h.tagline}</p>
      <p class="hc-desc">${h.intro}</p>
      <div class="hc-chips">${h.highlights.map((t) => `<span class="chip">${t}</span>`).join('')}</div>
      <div class="hc-foot">
        <span class="hc-n"><b>${list.length}</b> 件展品 · ${tpl.size.w}×${tpl.size.d} m</span>
        <span class="hc-go">查看详情
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </div>
    </div>
    <a class="hc-link" href="./hall.html?hall=${h.id}" aria-label="进入${h.name}"></a>
  </article>`;
}).join('');

const n = String(EXHIBITS.length);
$('#statEx').textContent = n;
$('#statEx2').textContent = n;
