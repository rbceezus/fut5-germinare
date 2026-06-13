// ===================== SQUAD MANAGER

// ===================== SQUAD MANAGER =====================

let sqSelected = null; // { type:'starter'|'bench', idx }
let sqCareerScheme = 'quadrado';

function renderSquadManager() {
  ensureCareerFormationState();
  sqSelected = null;
  sqCareerScheme = career.scheme || 'quadrado';
  state.scheme = sqCareerScheme;
  document.getElementById('sq-hint').textContent = 'Toque em um jogador do elenco e depois em um slot do campinho para escalar.';

  const bar = document.getElementById('sq-scheme-bar');
  bar.innerHTML = '';
  Object.entries(SCHEMES).forEach(([key, s]) => {
    const btn = document.createElement('button');
    btn.className = 'scheme-chip' + (key === sqCareerScheme ? ' active' : '');
    btn.textContent = s.name;
    btn.onclick = () => changeCareerScheme(key);
    bar.appendChild(btn);
  });

  renderSqField();
  renderSqList();
}

function changeCareerScheme(key) {
  if (!SCHEMES[key]) return;
  sqCareerScheme = key;
  career.scheme = key;
  state.scheme = key;
  sqSelected = null;
  renderSquadManager();
}

function renderSqField() {
  const field = document.getElementById('sq-field');
  if (!field) return;
  const formation = getCareerFormationEntries();
  field.innerHTML = `
    <div class="field-goal-top"></div><div class="field-goal-bottom"></div>
    <div class="field-area-top"></div><div class="field-area-bottom"></div>
  `;

  getSlotsForScheme(sqCareerScheme).forEach(def => {
    const p = formation[def.key];
    const slot = document.createElement('div');
    slot.className = 'field-slot ' + (p ? 'filled' : 'empty');
    slot.style.left = def.x + '%';
    slot.style.top = def.y + '%';
    slot.dataset.pos = def.key;
    slot.dataset.posLabel = def.label;
    slot.onclick = () => placeCareerSelectedInSlot(def.key);

    if (p) {
      const eOvr = getMatchEffectiveOvr(p, def.key, sqCareerScheme);
      const isBad = eOvr < p.ovr;
      const isBuff = eOvr > p.ovr;
      slot.className = `field-slot filled${isBuff ? ' pos-buff' : ''}`;
      slot.innerHTML = `
        <span class="slot-ovr" style="color:${isBad ? 'var(--red)' : isBuff ? 'var(--gold)' : 'var(--green-dark)'}">${eOvr}${isBad ? '<span style="font-size:9px;vertical-align:super;">▼</span>' : isBuff ? '<span style="font-size:9px;vertical-align:super;">▲</span>' : ''}</span>
        <span class="slot-name">${p.name}</span>
      `;
      slot.title = isBad ? 'Fora da posição: -10 OVR real em jogo' : 'Clique para trocar';
    }
    field.appendChild(slot);
  });
}

function clearCareerSlotHighlights() {
  document.querySelectorAll('#sq-field .field-slot').forEach(s => s.classList.remove('highlight', 'highlight-buff'));
}

function highlightCareerSlotsFor(player) {
  clearCareerSlotHighlights();
  const slots = getSlotsForScheme(sqCareerScheme);
  document.querySelectorAll('#sq-field .field-slot').forEach(s => {
    const def = slots.find(d => d.key === s.dataset.pos);
    if (def && def.roles.includes(player.posicao_favorita)) {
      s.classList.add('highlight-buff');
    } else {
      s.classList.add('highlight');
    }
  });
}

function selectCareerSquadPlayer(player) {
  if (sqSelected && sqSelected.player.id === player.id) {
    sqSelected = null;
    clearCareerSlotHighlights();
    document.getElementById('sq-hint').textContent = 'Toque em um jogador do elenco e depois em um slot do campinho para escalar.';
    renderSqList();
    return;
  }

  sqSelected = { player };
  document.getElementById('sq-hint').textContent = `${player.name} selecionado - toque em uma posicao do campinho.`;
  renderSqList();
  highlightCareerSlotsFor(player);
}

function renderSqList() {
  const container = document.getElementById('sq-all-list');
  container.innerHTML = '';

  const starterIds = new Set(career.squad.map(p => String(p.id)));
  const starters = [...career.squad].sort((a, b) => b.ovr - a.ovr);
  const benchSorted = [...career.bench]
    .filter(p => !starterIds.has(String(p.id)))
    .sort((a, b) => b.ovr - a.ovr);
  const reserves = benchSorted.slice(0, CAREER_BENCH);   // só 3 reservas no elenco
  const extras = benchSorted.slice(CAREER_BENCH);        // demais ficam fora do elenco

  document.getElementById('sq-starters-count').textContent = `(${career.squad.length}/${CAREER_STARTERS})`;
  document.getElementById('sq-bench-count').textContent = `(${reserves.length}/${CAREER_BENCH})`;

  const addHeader = (txt, color, sub) => {
    const h = document.createElement('div');
    h.style.cssText = `font-family:'Bebas Neue',cursive;font-size:15px;letter-spacing:2px;color:${color};margin:8px 2px 2px;`;
    h.innerHTML = `${txt}${sub ? ` <span style="font-size:10px;color:var(--text-muted);font-family:'Inter',sans-serif;letter-spacing:0;">${sub}</span>` : ''}`;
    container.appendChild(h);
  };

  const addRow = (p, group) => {
    const pos = POS_INFO[p.posicao_favorita];
    const isSelected = sqSelected && sqSelected.player.id === p.id;
    const isInjured = isCareerPlayerInjured(p);
    const pot = p.potential || 99;
    const tagText = group === 'starter' ? 'TITULAR' : group === 'reserve' ? 'RESERVA' : 'FORA';
    const tagColor = group === 'starter' ? 'var(--green-dark)' : group === 'reserve' ? 'var(--blue)' : 'var(--text-muted)';

    const row = document.createElement('div');
    row.style.cssText = `
      display:flex;align-items:center;gap:10px;
      background:${isSelected ? 'rgba(156,39,217,0.12)' : 'var(--card)'};
      border:1.5px solid ${isSelected ? 'var(--purple)' : p.id === 9999 ? 'rgba(156,39,217,0.4)' : 'var(--line)'};
      border-radius:12px;padding:10px 14px;cursor:pointer;transition:all .15s;${isInjured ? 'opacity:.55;' : ''}${group === 'extra' ? 'opacity:.75;' : ''}
    `;
    row.innerHTML = `
      <div style="text-align:center;min-width:42px;">
        <div style="font-family:'Bebas Neue',cursive;font-size:22px;line-height:1;color:var(--text);">${p.ovr}</div>
        <div style="font-size:9px;letter-spacing:1px;color:var(--text-muted);">POT ${pot}</div>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}${p.id === 9999 ? ' ⭐' : ''}</div>
        <span class="pos-tag ${pos.cls}" style="font-size:10px;">${pos.icon} ${pos.cls.toUpperCase()}</span>
        <span style="font-size:10px;color:${tagColor};font-weight:800;margin-left:5px;">${tagText}</span>
        ${isInjured ? '<span style="font-size:10px;color:var(--red);font-weight:700;margin-left:4px;">🏥</span>' : ''}
      </div>
      ${isSelected ? '<div style="font-size:18px;">✓</div>' : ''}
    `;
    row.onclick = () => selectCareerSquadPlayer(p);
    container.appendChild(row);
  };

  addHeader('TITULARES', 'var(--green-dark)');
  starters.forEach(p => addRow(p, 'starter'));

  addHeader('RESERVAS', 'var(--blue)', `máx ${CAREER_BENCH}`);
  if (reserves.length) reserves.forEach(p => addRow(p, 'reserve'));
  else {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:11px;color:var(--text-muted);padding:4px 2px;';
    empty.textContent = 'Nenhum reserva.';
    container.appendChild(empty);
  }

  if (extras.length) {
    addHeader('FORA DO ELENCO', 'var(--text-muted)', 'não entram em campo');
    extras.forEach(p => addRow(p, 'extra'));
  }
}

function placeCareerSelectedInSlot(slotKey) {
  const formation = getCareerFormationEntries();
  const currentInSlot = formation[slotKey];

  if (!sqSelected) {
    if (currentInSlot) {
      selectCareerSquadPlayer(currentInSlot);
    } else {
      document.getElementById('sq-hint').textContent = 'Selecione primeiro um jogador da lista.';
    }
    return;
  }

  const player = sqSelected.player;
  const playerCurrentSlot = FORMATION_KEYS.find(key => formation[key] && formation[key].id === player.id);

  career.formation = normalizeCareerFormationIds(career.formation);
  if (playerCurrentSlot) career.formation[playerCurrentSlot] = currentInSlot ? currentInSlot.id : null;
  career.formation[slotKey] = player.id;
  syncCareerSquadFromFormation();

  sqSelected = null;
  clearCareerSlotHighlights();
  renderSqField();
  renderSqList();
  document.getElementById('sq-hint').textContent = 'Escalacao atualizada no campinho.';
}

function saveSquadChanges() {
  career.scheme = sqCareerScheme;
  buildCareerFormation();
  updateCareerClubOvr();
  saveCareer();
  renderCareerHub();
  showScreen('career-hub');
}
