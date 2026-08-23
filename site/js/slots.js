/**
 * 槽位分配（纯逻辑，不依赖 three.js）
 * 3D 展厅与详情页平面图共用同一套结果，保证编号一致。
 */

/**
 * 按 tier 匹配展品与槽位。tier 相同的按声明顺序一一对应；
 * 若某 tier 展品多于槽位，溢出者退到 tier 差值最小、且台面装得下的空槽。
 *
 * @param {{slots:Array}} tpl
 * @param {Array} exhibits
 * @returns {{pairs:Array<{exhibit:Object, slot:Object}>, idleSlots:Array}}
 */
export function assignSlots(tpl, exhibits) {
  const free = tpl.slots.map((s) => ({ slot: s, used: false }));
  const pairs = [];
  const overflow = [];

  // 第一轮：同 tier 顺序配对
  for (const ex of exhibits) {
    const hit = free.find((f) => !f.used && f.slot.tier === ex.tier);
    if (hit) {
      hit.used = true;
      pairs.push({ exhibit: ex, slot: hit.slot });
    } else {
      overflow.push(ex);
    }
  }

  // 第二轮：溢出展品找最接近的空槽（能装下优先，其次 tier 距离近）
  for (const ex of overflow) {
    const cands = free.filter((f) => !f.used);
    if (!cands.length) {
      console.warn('[slots] 槽位不足，展品未上台：', ex.id);
      continue;
    }
    cands.sort((a, b) => {
      const fit = (s) => (Math.min(s.fp[0], s.fp[1]) >= ex.size * 0.55 ? 0 : 1);
      const da = fit(a.slot) * 10 + Math.abs(a.slot.tier - ex.tier);
      const db = fit(b.slot) * 10 + Math.abs(b.slot.tier - ex.tier);
      return da - db;
    });
    cands[0].used = true;
    pairs.push({ exhibit: ex, slot: cands[0].slot });
  }

  // 按展品声明顺序输出，保证编号稳定
  pairs.sort((a, b) => exhibits.indexOf(a.exhibit) - exhibits.indexOf(b.exhibit));

  const idleSlots = free.filter((f) => !f.used).map((f) => f.slot);
  return { pairs, idleSlots };
}
