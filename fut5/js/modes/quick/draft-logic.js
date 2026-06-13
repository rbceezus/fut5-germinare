// ===================== DRAFT LOGIC =====================
function nextDraftRound() {
  if (state.round >= 5) {
    showScreen('formation');
    renderSchemeBar();
    rebuildFieldSlots();
    renderBench();
    return;
  }

  state.round++;
  document.getElementById('draftRound').textContent = `RODADA ${state.round} / 5`;

  // 5 opções por rodada — nunca mostra jogadores já escolhidos
  const pickedIds = new Set(state.myPicks.map(p => p.id));
  const available = state.draftPool.filter(p => !pickedIds.has(p.id));
  state.currentOptions = weightedSample(available, 5);

  const container = document.getElementById('draftCards');
  container.innerHTML = '';
  container.classList.add('shuffling');

  state.currentOptions.forEach((p, i) => {
    const rarity = getRarity(p.ovr);
    const pos = POS_INFO[p.posicao_favorita];
    const card = document.createElement('div');
    card.className = `player-card ${rarity.cssClass}`;
    card.innerHTML = `
      <span class="rarity-badge ${rarity.tier}">${rarity.label}</span>
      <div class="card-ovr ${rarity.colorClass}">${p.ovr}</div>
      <div class="card-ovr-label">OVR</div>
      <div class="card-name">${p.name}</div>
      <div class="card-team">${p.team}</div>
      <div class="card-pos pos-${pos.cls}">${pos.icon} ${pos.label}<span class="card-pos-sub">posição favorita · +2 OVR</span></div>
    `;
    card.onclick = () => pickPlayer(p, card);
    container.appendChild(card);
  });

  setTimeout(() => container.classList.remove('shuffling'), 500);
}

function pickPlayer(player, cardEl) {
  if (state.myPicks.length >= 5) return;

  state.myPicks.push(player);

  cardEl.classList.add('picked');

  document.querySelectorAll('.player-card').forEach(c => {
    if (c !== cardEl) c.classList.add('dismissed');
    c.style.pointerEvents = 'none';
  });

  renderPickedBar();
  renderRoster();

  const rosterRow = document.getElementById(`roster-row-${player.id}`);
  if (rosterRow) rosterRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  setTimeout(() => nextDraftRound(), 700);
}

function renderPickedBar() {
  const bar = document.getElementById('pickedBar');
  bar.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const slot = document.createElement('div');
    const p = state.myPicks[i];
    if (p) {
      const pos = POS_INFO[p.posicao_favorita];
      slot.className = 'picked-slot filled';
      slot.innerHTML = `<span class="picked-ovr">${p.ovr}</span><span class="picked-pos" style="color:var(--text-muted)">${pos.icon}</span>`;
      slot.title = `${p.name} — ${pos.label}`;
    } else {
      slot.className = 'picked-slot';
      slot.textContent = i + 1;
    }
    bar.appendChild(slot);
  }
}
