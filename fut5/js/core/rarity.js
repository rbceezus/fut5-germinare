// ===================== RARITY SYSTEM =====================
function getRarity(ovr) {
  if (ovr >= 96) return { tier: 'legendary', label: 'Lendário', cssClass: 'tier-legendary', colorClass: 'rarity-legendary' };
  if (ovr >= 90) return { tier: 'very-rare', label: 'Muito Raro', cssClass: 'tier-very-rare', colorClass: 'rarity-very-rare' };
  if (ovr >= 80) return { tier: 'rare', label: 'Raro', cssClass: 'tier-rare', colorClass: 'rarity-rare' };
  return { tier: 'common', label: 'Comum', cssClass: 'tier-common', colorClass: 'rarity-common' };
}

function getWeight(ovr) {
  if (ovr >= 96) return 2;
  if (ovr >= 90) return 5;
  if (ovr >= 80) return 8;
  return 10;
}

function weightedSample(players, count) {
  const pool = [...players];
  const result = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const weights = pool.map(p => getWeight(p.ovr));
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * totalWeight;
    let idx = 0;
    for (idx = 0; idx < weights.length; idx++) {
      r -= weights[idx];
      if (r <= 0) break;
    }
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}
