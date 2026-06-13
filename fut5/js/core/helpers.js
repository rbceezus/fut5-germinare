// ===================== HELPERS =====================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ovrClass(ovr) {
  return getRarity(ovr).colorClass;
}

function showLoading(message = 'Carregando...') {
  const overlay = document.getElementById('loadingOverlay');
  const label = document.getElementById('loadingText');
  const menuStatus = document.getElementById('menuStatus');

  if (label) label.textContent = message;
  if (menuStatus) menuStatus.textContent = message;
  document.body.classList.add('is-loading');
  if (overlay) overlay.classList.add('active');
}

function hideLoading(delay = 260) {
  window.setTimeout(() => {
    const overlay = document.getElementById('loadingOverlay');
    const menuStatus = document.getElementById('menuStatus');

    document.body.classList.remove('is-loading');
    if (overlay) overlay.classList.remove('active');
    if (menuStatus) menuStatus.textContent = 'Pronto para jogar';
  }, delay);
}

function runWithLoading(message, fn) {
  showLoading(message);
  window.setTimeout(() => {
    try {
      fn();
    } catch (err) {
      console.error(err);
      hideLoading(0);
      alert('O jogo encontrou um erro ao carregar esta tela. Abra o console para ver detalhes.');
    }
  }, 120);
}

function showScreen(id) {
  const target = document.getElementById(id);

  if (!target) {
    console.warn(`Tela não encontrada: ${id}`);
    hideLoading(0);
    return;
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  target.classList.add('active');
  hideLoading();
}

function avgOvr(players) {
  if (!players.length) return 0;
  return Math.round(players.reduce((s, p) => s + p.ovr, 0) / players.length);
}


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getSlotDefinition(slotKey, schemeKey = state.scheme) {
  return getSlotsForScheme(schemeKey).find(s => s.key === slotKey) || null;
}

function isGoalkeeperSlot(slotKey) {
  return slotKey === 'gk';
}

function getMatchSlotForIndex(index) {
  if (index === 0) return 'gk';
  return ['s1','s2','s3','s4'][index - 1] || 's1';
}

function getMatchEffectiveOvr(player, slotKey, schemeKey = state.scheme) {
  if (!player) return 0;
  const def = getSlotDefinition(slotKey, schemeKey);
  const isGk = player.posicao_favorita === 'gk';
  const slotIsGk = isGoalkeeperSlot(slotKey);
  let value = player.ovr;

  // Penalidade real por improviso extremo: goleiro na linha ou jogador de linha no gol.
  if (isGk && !slotIsGk) value -= 10;
  if (!isGk && slotIsGk) value -= 10;

  // Buff leve apenas quando a posição combina com o slot.
  if (def && def.roles.includes(player.posicao_favorita)) value += 2;

  // Espaço para sistemas novos de forma/moral sem quebrar saves antigos.
  if (typeof player.form === 'number') value += player.form;
  if (typeof player.morale === 'number') value += Math.round((player.morale - 50) / 25);

  return clamp(Math.round(value), 1, 99);
}

function normalizeTeamForMatch(team) {
  const arr = (team || []).filter(Boolean).slice(0, 5).map(p => ({ ...p }));
  if (!arr.length) return arr;
  const gkIndex = arr.findIndex(p => p.posicao_favorita === 'gk');
  if (gkIndex > 0) {
    const [gk] = arr.splice(gkIndex, 1);
    arr.unshift(gk);
  }
  return arr.map((p, index) => ({
    ...p,
    matchSlot: getMatchSlotForIndex(index),
    ovr: getMatchEffectiveOvr(p, getMatchSlotForIndex(index))
  }));
}

function getTeamGoalkeeper(team) {
  if (!team || !team.length) return null;
  return team.find(p => p && p.matchSlot === 'gk') || team.find(p => p && p.posicao_favorita === 'gk') || team[0];
}

function getActiveTeam(team) {
  return (team || []).filter(p => p && !state.redCards.has(p.id));
}

function pickWeightedBy(players, weightFn) {
  const valid = (players || []).filter(Boolean);
  if (!valid.length) return null;
  const weights = valid.map(p => Math.max(1, weightFn(p)));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < valid.length; i++) {
    r -= weights[i];
    if (r <= 0) return valid[i];
  }
  return valid[valid.length - 1];
}

function shouldGoToPenalties() {
  if (gameMode === 'cup' && tournament && tournament.phase !== 'groups') return true;
  if (gameMode === 'career' && career && career.currentCompetition === 'cup' && career.currentPhase === 'knockout') return true;
  return false;
}
