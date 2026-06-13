// ===================== PRE-MATCH SCREEN =====================

// ===================== PRE-MATCH SCREEN =====================

let prematchAwayTeam = null;
let prematchAwayName = '';

function careerPlayMatch() {
  if (!career) return;
  ensureCareerSeasonState();

  if (career.matchesPlayed >= CAREER_MATCHES_PER_SEASON) {
    showCareerSeasonEnd();
    return;
  }

  const myMatch = getCareerMyMatch();
  if (!myMatch) {
    alert('Erro no calendário da temporada. Um novo calendário será gerado.');
    career.fixtures = buildSeasonFixtures(career.standings);
    saveCareer();
    return;
  }

  state.currentCareerMatch = myMatch;
  prematchAwayName = myMatch.home === career.clubName ? myMatch.away : myMatch.home;
  prematchAwayTeam = generateCareerOpponentTeam(prematchAwayName);

  document.getElementById('prematch-home-name').textContent = career.clubName;
  document.getElementById('prematch-away-name').textContent = prematchAwayName;
  document.getElementById('prematch-season-label').textContent =
    `Temporada ${career.season} · Rodada ${career.matchesPlayed + 1} de ${CAREER_MATCHES_PER_SEASON}`;

  const homeDiv = document.getElementById('prematch-home-squad');
  homeDiv.innerHTML = '';
  const activeBench = [...career.bench].sort((a, b) => b.ovr - a.ovr).slice(0, CAREER_BENCH);
  [...career.squad, ...activeBench].forEach((p, i) => {
    const pos = POS_INFO[p.posicao_favorita];
    const isMe = p.id === 9999;
    const isInjured = career.injuries[p.id] > 0;
    const isBench = i >= career.squad.length;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--line);';
    row.innerHTML = `
      <div style="font-family:'Bebas Neue',cursive;font-size:16px;min-width:28px;color:var(--text);">${p.ovr}</div>
      <span class="pos-tag ${pos.cls}" style="font-size:9px;">${pos.icon}</span>
      <div style="font-size:12px;font-weight:${isMe?'800':'600'};flex:1;color:${isMe?'rgba(200,150,255,1)':'var(--text)'};">${p.name}${isMe?' ⭐':''}</div>
      ${isBench ? '<span style="font-size:9px;color:var(--text-muted);letter-spacing:1px;">RES</span>' : ''}
      ${isInjured ? '<span style="font-size:10px;">🏥</span>' : ''}
    `;
    homeDiv.appendChild(row);
  });

  const awayDiv = document.getElementById('prematch-away-squad');
  awayDiv.innerHTML = '';
  prematchAwayTeam.forEach((p, i) => {
    const pos = POS_INFO[p.posicao_favorita];
    const isBench = i >= CAREER_STARTERS;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--line);';
    row.innerHTML = `
      <div style="font-family:'Bebas Neue',cursive;font-size:16px;min-width:28px;color:var(--text);">${p.ovr}</div>
      <span class="pos-tag ${pos.cls}" style="font-size:9px;">${pos.icon}</span>
      <div style="font-size:12px;font-weight:600;flex:1;">${p.name}</div>
      ${isBench ? '<span style="font-size:9px;color:var(--text-muted);letter-spacing:1px;">RES</span>' : ''}
    `;
    awayDiv.appendChild(row);
  });

  showScreen('career-prematch');
}


function confirmAndStartCareerMatch() {
  buildCareerFormation();

  state.awayName = prematchAwayName;
  state.awayTeam = prematchAwayTeam;
  state.currentCareerMatch = state.currentCareerMatch || getCareerMyMatch();

  document.getElementById('teamHomeName').textContent = career.clubName;
  document.getElementById('teamAwayName').textContent = state.awayName;

  gameMode = 'career';
  startMatch();
}

// Override showScreen

// Override showScreen to trigger career renders
const _origShowScreen = showScreen;
showScreen = function(id) {
  _origShowScreen(id);
  if (id === 'career-training-center' && career) renderTrainingCenter();
  if (id === 'career-player-profile' && career) updateCareerProfileCard();
  if (id === 'career-standings' && career) renderCareerStandings();
  if (id === 'career-transfers' && career) renderCareerTransfers();
  if (id === 'career-squad-manager' && career) renderSquadManager();
  if (id === 'career-hub' && career) renderCareerHub();
};
