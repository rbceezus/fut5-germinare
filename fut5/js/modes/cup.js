// ===================== CAMPEONATO =====================
function setupCup() {
  const usedIds = new Set(state.myPicks.map(p => p.id));
  const availablePlayers = shuffle(ALL_PLAYERS.filter(p => !usedIds.has(p.id)));
  const teamNames = shuffle([...TEAM_NAMES_AWAY, "Caneta Azul FC", "Zaga de Ferro", "Chapéu FC", "Firula United", "Tabela Mágica"]);
  const aiTeams = [];

  for (let i = 0; i < 15; i++) {
    const players = availablePlayers.splice(0, Math.min(5, availablePlayers.length));
    while (players.length < 5) {
      players.push({ id: 2000 + i * 10 + players.length, name: "Reserva", team: "?", ovr: 50 + Math.floor(Math.random() * 40), posicao_favorita: 'ata' });
    }
    aiTeams.push({ name: teamNames[i] || `Time ${i+1}`, players, ovr: avgOvr(players), isPlayer: false });
  }

  const myTeam = {
    name: "SUA SELEÇÃO",
    players: Object.values(state.formation).filter(Boolean),
    ovr: avgOvr(Object.values(state.formation).filter(Boolean)),
    isPlayer: true,
  };

  const allTeams = shuffle([myTeam, ...aiTeams]);
  const groups = [[], [], [], []];
  const pidx = allTeams.findIndex(t => t.isPlayer);
  groups[0].push(allTeams.splice(pidx, 1)[0]);
  for (let i = 0; i < 3; i++) groups[0].push(allTeams.shift());
  for (let g = 1; g <= 3; g++) for (let i = 0; i < 4; i++) groups[g].push(allTeams.shift());

  groups.forEach(gr => gr.forEach(t => { t.pts=0; t.gf=0; t.ga=0; t.w=0; t.d=0; t.l=0; }));

  const groupMatches = [];
  groups.forEach((gr, gIdx) => {
    for (let i = 0; i < gr.length; i++)
      for (let j = i+1; j < gr.length; j++)
        groupMatches.push({ home: gr[i], away: gr[j], group: gIdx, played: false, scoreH: 0, scoreA: 0 });
  });
  groupMatches.sort((a, b) => {
    const ap = a.home.isPlayer || a.away.isPlayer;
    const bp = b.home.isPlayer || b.away.isPlayer;
    return ap === bp ? 0 : ap ? -1 : 1;
  });

  tournament = { groups, groupMatches, phase: 'groups', knockout: [] };
  showScreen('tournament');
  renderGroupStage();
}

function renderGroupStage() {
  const t = tournament;
  const groupNames = ['A','B','C','D'];
  document.getElementById('tournamentTitle').textContent = 'FASE DE GRUPOS';

  const playerMatches = t.groupMatches.filter(m => (m.home.isPlayer || m.away.isPlayer) && !m.played);
  const totalPM = t.groupMatches.filter(m => m.home.isPlayer || m.away.isPlayer).length;
  const played = totalPM - playerMatches.length;
  const btn = document.getElementById('tournamentBtn');

  if (playerMatches.length > 0) {
    document.getElementById('tournamentPhase').textContent = `Jogo ${played + 1} de ${totalPM}`;
    btn.textContent = 'Jogar Próxima Partida';
    btn.onclick = () => nextCupMatch();
    btn.style.display = 'block';
  } else {
    simRemainingGroups();
    document.getElementById('tournamentPhase').textContent = 'Fase encerrada';
    const sorted = [...t.groups[0]].sort(groupSort);
    const pos = sorted.findIndex(tm => tm.isPlayer);
    if (pos >= 2) {
      btn.style.display = 'none';
      setTimeout(() => {
        document.getElementById('elimSub').textContent = `Seu time ficou em ${pos+1}º no Grupo A e foi eliminado.`;
        showScreen('eliminated');
      }, 500);
    } else {
      btn.textContent = 'Avançar para Mata-Mata';
      btn.onclick = () => setupKnockout();
      btn.style.display = 'block';
    }
  }

  const container = document.getElementById('groupContainer');
  container.innerHTML = '';
  t.groups.forEach((gr, gIdx) => {
    const sorted = [...gr].sort(groupSort);
    const allDone = t.groupMatches.filter(m => m.group === gIdx).every(m => m.played);
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:var(--shadow);';
    card.innerHTML = `
      <div style="font-family:'Bebas Neue',cursive;font-size:18px;color:var(--green-dark);letter-spacing:2px;text-align:center;margin-bottom:8px;">Grupo ${groupNames[gIdx]}</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tr style="color:var(--text-muted);font-weight:600;"><th style="text-align:left;padding:4px 2px;">Time</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GF</th><th>GA</th><th>Pts</th></tr>
        ${sorted.map((tm, idx) => {
          let color = 'var(--text)';
          if (allDone && idx < 2) color = 'var(--green-dark)';
          if (allDone && idx >= 2) color = 'var(--text-muted)';
          const bold = tm.isPlayer ? 'font-weight:800;' : '';
          return `<tr style="color:${color};${bold}border-bottom:1px solid var(--line);">
            <td style="text-align:left;padding:6px 2px;">${tm.isPlayer ? '⭐ ' : ''}${tm.name}</td>
            <td style="text-align:center;">${tm.w+tm.d+tm.l}</td><td style="text-align:center;">${tm.w}</td><td style="text-align:center;">${tm.d}</td><td style="text-align:center;">${tm.l}</td>
            <td style="text-align:center;">${tm.gf}</td><td style="text-align:center;">${tm.ga}</td><td style="text-align:center;font-weight:700;">${tm.pts}</td></tr>`;
        }).join('')}
      </table>`;
    container.appendChild(card);
  });
}

function groupSort(a, b) {
  return (b.pts - a.pts) || ((b.gf - b.ga) - (a.gf - a.ga)) || (b.gf - a.gf);
}

function simRemainingGroups() {
  tournament.groupMatches.forEach(m => {
    if (m.played) return;
    const r = simAI(m.home, m.away);
    m.scoreH = r.h; m.scoreA = r.a; m.played = true;
    applyGroupResult(m.home, m.away, r.h, r.a);
  });
}

function simAI(tA, tB) {
  const diff = tA.ovr - tB.ovr;
  const ch = Math.max(0.25, Math.min(0.75, 0.5 + diff * 0.005));
  let h = 0, a = 0;
  for (let i = 0; i < 8; i++) { if (Math.random() < 0.25) { if (Math.random() < ch) h++; else a++; } }
  return { h, a };
}

function applyGroupResult(tH, tA, gH, gA) {
  tH.gf += gH; tH.ga += gA; tA.gf += gA; tA.ga += gH;
  if (gH > gA) { tH.pts += 3; tH.w++; tA.l++; }
  else if (gH < gA) { tA.pts += 3; tA.w++; tH.l++; }
  else { tH.pts++; tA.pts++; tH.d++; tA.d++; }
}

function setupKnockout() {
  const t = tournament;
  t.phase = 'quarters';
  const qualified = [];
  t.groups.forEach(gr => {
    const sorted = [...gr].sort(groupSort);
    qualified.push(sorted[0], sorted[1]);
  });
  t.knockout = [
    { round: 'quarters', matches: [
      { home: qualified[0], away: qualified[3], played: false, scoreH:0, scoreA:0, pens:null },
      { home: qualified[4], away: qualified[7], played: false, scoreH:0, scoreA:0, pens:null },
      { home: qualified[2], away: qualified[1], played: false, scoreH:0, scoreA:0, pens:null },
      { home: qualified[6], away: qualified[5], played: false, scoreH:0, scoreA:0, pens:null },
    ]},
    { round: 'semis', matches: [
      { home:null, away:null, played:false, scoreH:0, scoreA:0, pens:null },
      { home:null, away:null, played:false, scoreH:0, scoreA:0, pens:null },
    ]},
    { round: 'final', matches: [
      { home:null, away:null, played:false, scoreH:0, scoreA:0, pens:null },
    ]},
  ];
  showScreen('bracket');
  renderBracket();
}

function renderBracket() {
  const t = tournament;
  const container = document.getElementById('bracketContainer');
  container.innerHTML = '';
  const names = { quarters:'QUARTAS', semis:'SEMI', final:'FINAL' };
  document.getElementById('bracketPhase').textContent = names[t.phase] || '';

  t.knockout.forEach(round => {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:16px;min-width:170px;';
    col.innerHTML = `<div style="font-family:'Bebas Neue',cursive;font-size:14px;color:var(--text-muted);text-align:center;letter-spacing:2px;">${names[round.round]}</div>`;
    round.matches.forEach(match => {
      const isCurr = !match.played && match.home && match.away && (match.home.isPlayer || match.away.isPlayer) && t.phase === round.round;
      const el = document.createElement('div');
      el.style.cssText = `background:var(--card);border-radius:10px;padding:10px;border:${isCurr ? '2px solid var(--green)' : '1px solid var(--line)'};box-shadow:${isCurr ? '0 0 12px rgba(0,166,81,0.3)' : 'var(--shadow)'};`;
      const hN = match.home ? (match.home.isPlayer ? '⭐ SUA SELEÇÃO' : match.home.name) : '???';
      const aN = match.away ? (match.away.isPlayer ? '⭐ SUA SELEÇÃO' : match.away.name) : '???';
      let hStyle = '', aStyle = '';
      if (match.played) {
        const hWon = match.scoreH > match.scoreA || (match.pens && match.pens.winner === 'home');
        hStyle = hWon ? 'color:var(--green-dark);font-weight:700;' : 'color:var(--text-muted);opacity:0.6;';
        aStyle = hWon ? 'color:var(--text-muted);opacity:0.6;' : 'color:var(--green-dark);font-weight:700;';
      }
      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;${hStyle}"><span>${hN}</span><span style="font-family:'Bebas Neue',cursive;font-size:18px;">${match.played ? match.scoreH : ''}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;${aStyle}"><span>${aN}</span><span style="font-family:'Bebas Neue',cursive;font-size:18px;">${match.played ? match.scoreA : ''}</span></div>`;
      col.appendChild(el);
    });
    container.appendChild(col);
  });

  const btn = document.getElementById('bracketBtn');
  const currRound = t.knockout.find(r => r.round === t.phase);
  const pMatch = currRound?.matches.find(m => !m.played && m.home && m.away && (m.home.isPlayer || m.away.isPlayer));
  btn.style.display = pMatch ? 'block' : 'none';
}

function nextCupMatch() {
  const t = tournament;
  if (t.phase === 'groups') {
    const match = t.groupMatches.find(m => (m.home.isPlayer || m.away.isPlayer) && !m.played);
    if (!match) return;
    const isHome = match.home.isPlayer;
    _cupMatch = match;
    _cupIsHome = isHome;
    const opp = isHome ? match.away : match.home;
    state.awayTeam = opp.players;
    state.awayName = opp.name;
    const played = t.groupMatches.filter(m => (m.home.isPlayer || m.away.isPlayer) && m.played).length;
    updateMatchTitle('FASE DE GRUPOS - JOGO ' + (played + 1) + '/3');
    startMatch();
  } else {
    const currRound = t.knockout.find(r => r.round === t.phase);
    const match = currRound.matches.find(m => !m.played && m.home && m.away && (m.home.isPlayer || m.away.isPlayer));
    if (!match) return;
    const isHome = match.home.isPlayer;
    _cupMatch = match;
    _cupIsHome = isHome;
    const opp = isHome ? match.away : match.home;
    state.awayTeam = opp.players;
    state.awayName = opp.name;
    const phaseNames = {quarters:'QUARTAS DE FINAL',semis:'SEMIFINAL',final:'GRANDE FINAL'};
    updateMatchTitle((phaseNames[t.phase] || t.phase.toUpperCase()) + ' · COPA 26');
    startMatch();
  }
}

function updateMatchTitle(text) {
  const el = document.getElementById('matchTitleText');
  if (el) el.textContent = text;
}

function cupAfterMatch() {
  const t = tournament;
  const h = state.matchGoalsHome, a = state.matchGoalsAway;
  const match = _cupMatch;

  if (_cupIsHome) { match.scoreH = h; match.scoreA = a; }
  else { match.scoreH = a; match.scoreA = h; }
  match.played = true;
  // Pênaltis também precisam ser gravados na orientação do CONFRONTO
  // (mandante/visitante da chave), igual ao placar — senão, ao vencer de
  // visitante nos pênaltis, o avanço da chave inverte o vencedor.
  if (state.penalties) {
    match.pens = _cupIsHome
      ? { home: state.penalties.home, away: state.penalties.away, winner: state.penalties.winner }
      : { home: state.penalties.away, away: state.penalties.home, winner: state.penalties.winner === 'home' ? 'away' : 'home' };
  }

  if (t.phase === 'groups') {
    applyGroupResult(match.home, match.away, match.scoreH, match.scoreA);
    showScreen('tournament');
    renderGroupStage();
  } else {
    // Check if player won (in match sim, player is always 'home')
    let playerWon = h > a || (state.penalties && state.penalties.winner === 'home');

    if (!playerWon) {
      const rn = { quarters:'nas Quartas', semis:'na Semifinal', final:'na Final' };
      document.getElementById('elimSub').textContent = `Eliminado ${rn[t.phase]}.`;
      showScreen('eliminated');
      return;
    }

    if (t.phase === 'final') {
      // Already shows CAMPEÃO in showResult
      return;
    }

    advanceBracket();
    showScreen('bracket');
    renderBracket();
  }
}

function advanceBracket() {
  const t = tournament;
  const idx = t.knockout.findIndex(r => r.round === t.phase);
  const curr = t.knockout[idx];
  // Sim AI matches
  curr.matches.forEach(m => {
    if (m.played || !m.home || !m.away) return;
    const r = simAI(m.home, m.away);
    m.scoreH = r.h; m.scoreA = r.a;
    if (r.h === r.a) {
      let hp=0,ap=0;
      for(let i=0;i<5;i++){if(Math.random()<0.7)hp++;if(Math.random()<0.7)ap++;}
      while(hp===ap){if(Math.random()<0.7)hp++;else ap++;}
      m.pens = { home:hp, away:ap, winner:hp>ap?'home':'away' };
    }
    m.played = true;
  });
  // Fill next
  if (idx < t.knockout.length - 1) {
    const next = t.knockout[idx + 1];
    const winners = curr.matches.map(m => {
      const hWon = m.scoreH > m.scoreA || (m.pens && m.pens.winner === 'home');
      return hWon ? m.home : m.away;
    });
    for (let i = 0; i < next.matches.length; i++) {
      next.matches[i].home = winners[i*2] || null;
      next.matches[i].away = winners[i*2+1] || null;
    }
    if (t.phase === 'quarters') t.phase = 'semis';
    else if (t.phase === 'semis') t.phase = 'final';
  }
}
const themeBtn=document.getElementById('themeToggle');

function applyTheme(isDark){
  document.documentElement.classList.toggle('dark', isDark);
  document.body.classList.toggle('dark', isDark);
  if(themeBtn) themeBtn.textContent = isDark ? '☀️' : '🌙';
}
applyTheme(localStorage.getItem('fg_theme')==='dark');
themeBtn?.addEventListener('click',()=>{
 const isDark = !document.documentElement.classList.contains('dark');
 applyTheme(isDark);
 localStorage.setItem('fg_theme', isDark ? 'dark' : 'light');
});

function enhanceDisplayedOvrs(){
 try{

  const allPlayers = [
    ...(state.myPicks || []),
    ...(state.draftedPlayers || []),
    ...(state.availablePlayers || []),
    ...Object.values(state.formation || {}).filter(Boolean)
  ];

  document.querySelectorAll(
    '.player-card,.bench-player,.field-slot.filled,.result-player-row,.picked-slot'
  ).forEach(el => {

    const txt = el.textContent || '';

    const player = allPlayers.find(
      p => p && txt.includes(p.name)
    );

    if(!player) return;

    const ovrEl = el.querySelector(
      '.card-ovr,.bp-ovr,.slot-ovr,.picked-ovr'
    );

    if(!ovrEl) return;

    const {
      finalOvr,
      positionBonus,
      totalBonus
    } = getDisplayOvr(player);

    const arrow =
      positionBonus > 0
      ? '<span style="font-size:9px;vertical-align:super;color:#d98e00">▲</span>'
      : '';

    ovrEl.innerHTML =
      totalBonus > 0
      ? `${finalOvr}${arrow} <span style="font-size:.45em;color:var(--gold)">(+${totalBonus})</span>`
      : `${finalOvr}${arrow}`;

  });

 } catch(e){}
}

enhanceDisplayedOvrs();
setInterval(enhanceDisplayedOvrs,500);
