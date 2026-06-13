// ===================== SPLASH → DRAFT =====================
function startDraft() {
  state.round = 0;
  state.myPicks = [];
  state.draftPool = shuffle(ALL_PLAYERS);
  state.scheme = 'quadrado';
  state.formation = { gk: null, s1: null, s2: null, s3: null, s4: null };

  renderPickedBar();
  renderRoster();
  showScreen('draft');
  nextDraftRound();
}

function renderRoster() {
  const list = document.getElementById('rosterList');
  if (!list) return;
  const sorted = [...ALL_PLAYERS].sort((a, b) => b.ovr - a.ovr);
  const pickedIds = new Set(state.myPicks.map(p => p.id));
  list.innerHTML = '';
  sorted.forEach(p => {
    const isPicked = pickedIds.has(p.id);
    const rarity = getRarity(p.ovr);
    const pos = POS_INFO[p.posicao_favorita];
    const row = document.createElement('div');
    row.className = `roster-row${isPicked ? ' picked' : ''}`;
    row.id = `roster-row-${p.id}`;
    row.innerHTML = `
      <span class="roster-ovr ${isPicked ? '' : rarity.colorClass}">${p.ovr}</span>
      <div class="roster-row-info">
        <div class="roster-name">${p.name}</div>
        <div class="roster-team">${p.team}</div>
      </div>
      <span class="roster-pos pos-tag ${pos.cls}">${pos.icon} ${pos.cls.toUpperCase()}</span>
    `;
    list.appendChild(row);
  });
}
