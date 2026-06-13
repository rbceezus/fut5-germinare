// ===================== CAREER MODE =====================

const CAREER_LEVEL_XP = [0,100,220,380,580,830,1130,1480,1880,2330,2840,3410,4050,4770,5580,6490,7520,8690,10020,11540,13280];
// index = level, value = XP needed to reach that level from 0
// Level ups: difference between consecutive entries

const CAREER_AI_TEAMS = [
  "Último Lance FC","Casa da Pedra","Sim Sim Sim?","Mesa do Pagode","Força Jovem",
  "Git Bash","Atende Play","Jumentos FC","Roldão Atacadista","Quadrilha FC","Canil",
  "Caneta Azul FC","Zaga de Ferro","Chapéu FC","Firula United","Tabela Mágica",
  "Saltimbanco FC","Brasa Viva","Velha Guarda","Explosão FC"
];

let career = null; // main career state
let careerDraftPicks = []; // during squad selection
let careerPlayerPos = 'ata';


function tpCost(ovr) {
  if (ovr < 70) return 1;
  if (ovr < 80) return 2;
  if (ovr < 88) return 3;
  if (ovr < 94) return 5;
  return 8;
}

function getCareerPlayerList() {
  return [...(career?.squad || []), ...(career?.bench || [])];
}

function getCareerPlayerById(id) {
  return getCareerPlayerList().find(p => p && String(p.id) === String(id)) || null;
}

function getCareerFormationFromSquad() {
  const formation = { gk: null, s1: null, s2: null, s3: null, s4: null };
  const starters = (career?.squad || []).slice(0, CAREER_STARTERS);
  const gk = starters.find(p => p.posicao_favorita === 'gk') || starters[0] || null;
  formation.gk = gk ? gk.id : null;

  let lineIdx = 0;
  starters.forEach(p => {
    if (!p || p.id === gk?.id || lineIdx >= 4) return;
    formation[['s1', 's2', 's3', 's4'][lineIdx++]] = p.id;
  });

  return formation;
}

function normalizeCareerFormationIds(raw = null) {
  const source = raw || career?.formation || getCareerFormationFromSquad();
  const ids = {};
  const used = new Set();

  FORMATION_KEYS.forEach(key => {
    const value = source ? source[key] : null;
    const id = value && typeof value === 'object' ? value.id : value;
    const player = id !== null && id !== undefined ? getCareerPlayerById(id) : null;
    if (player && !used.has(String(player.id))) {
      ids[key] = player.id;
      used.add(String(player.id));
    } else {
      ids[key] = null;
    }
  });

  return ids;
}

function getCareerFormationEntries() {
  const ids = normalizeCareerFormationIds();
  const formation = {};
  FORMATION_KEYS.forEach(key => {
    formation[key] = ids[key] !== null && ids[key] !== undefined ? getCareerPlayerById(ids[key]) : null;
  });
  return formation;
}

function ensureCareerFormationState() {
  if (!career) return;
  career.scheme = career.scheme || 'quadrado';
  career.formation = normalizeCareerFormationIds(career.formation);
  syncCareerSquadFromFormation();
}

function syncCareerSquadFromFormation() {
  if (!career) return;
  const ids = normalizeCareerFormationIds(career.formation);
  const all = getCareerPlayerList();
  const byId = new Map(all.filter(Boolean).map(p => [String(p.id), p]));
  const starters = [];
  const used = new Set();

  FORMATION_KEYS.forEach(key => {
    const p = byId.get(String(ids[key]));
    if (p && !used.has(String(p.id))) {
      starters.push(p);
      used.add(String(p.id));
    }
  });

  all.forEach(p => {
    if (starters.length >= CAREER_STARTERS) return;
    if (p && !used.has(String(p.id))) {
      starters.push(p);
      used.add(String(p.id));
    }
  });

  career.squad = starters.slice(0, CAREER_STARTERS);
  const starterIds = new Set(career.squad.map(p => String(p.id)));
  career.bench = all.filter((p, idx, arr) =>
    p &&
    !starterIds.has(String(p.id)) &&
    arr.findIndex(x => x && String(x.id) === String(p.id)) === idx
  );

  const assigned = new Set();
  career.formation = {};
  FORMATION_KEYS.forEach(key => {
    const existing = career.squad.find(p => String(p.id) === String(ids[key]) && !assigned.has(String(p.id)));
    if (existing) {
      career.formation[key] = existing.id;
      assigned.add(String(existing.id));
      return;
    }

    const next = career.squad.find(p => !assigned.has(String(p.id)));
    career.formation[key] = next ? next.id : null;
    if (next) assigned.add(String(next.id));
  });
}

function isCareerPlayerInjured(player) {
  return !!(career && player && career.injuries && career.injuries[player.id] > 0);
}

function getStandingByName(name) {
  return career?.standings?.find(t => t.name === name) || null;
}

function updateCareerClubOvr() {
  if (!career || !career.standings) return;
  const myTeam = career.standings.find(t => t.isPlayer);
  if (myTeam) myTeam.ovr = avgOvr([...career.squad, ...career.bench].slice(0, 5)) || 65;
}

function buildSeasonFixtures(standings) {
  const teams = standings.map(t => ({ name: t.name }));
  if (teams.length % 2 !== 0) teams.push({ name: 'FOLGA' });
  const arr = teams.slice();
  const rounds = [];

  for (let r = 0; r < arr.length - 1; r++) {
    const round = [];
    for (let i = 0; i < arr.length / 2; i++) {
      const home = arr[i].name;
      const away = arr[arr.length - 1 - i].name;
      if (home !== 'FOLGA' && away !== 'FOLGA') round.push({ home, away });
    }
    rounds.push(round);
    arr.splice(1, 0, arr.pop());
  }

  const returnLeg = rounds.map(round => round.map(m => ({ home: m.away, away: m.home })));
  return [...rounds, ...returnLeg].slice(0, CAREER_MATCHES_PER_SEASON);
}

function ensureCareerSeasonState() {
  if (!career) return;
  career.injuries = career.injuries || {};
  career.achievements = career.achievements || [];
  career.transferWindow = !!career.transferWindow;
  career.transferPlayers = career.transferPlayers || [];
  career.transferDeadline = career.transferDeadline ?? null;
  career.history = career.history || [];
  career.seasonEnded = !!career.seasonEnded;
  career.scheme = career.scheme || 'quadrado';
  ensureCareerFormationState();

  career.standings = (career.standings || buildSeasonStandings(career.clubName)).map(t => ({
    ovr: t.ovr || (t.isPlayer ? 65 : 58 + Math.floor(Math.random() * 18)),
    ...t
  }));

  if (!career.fixtures || career.fixtures.length < CAREER_MATCHES_PER_SEASON) {
    career.fixtures = buildSeasonFixtures(career.standings);
  }
  updateCareerClubOvr();
}

function migrateCareerSave(save) {
  career = save;
  ensureCareerSeasonState();
  return career;
}

function getCareerCurrentRound() {
  ensureCareerSeasonState();
  return career.fixtures[career.matchesPlayed] || [];
}

function getCareerMyMatch() {
  const round = getCareerCurrentRound();
  return round.find(m => m.home === career.clubName || m.away === career.clubName) || null;
}

function applyCareerStandingResult(homeName, awayName, goalsHome, goalsAway) {
  const h = getStandingByName(homeName);
  const a = getStandingByName(awayName);
  if (!h || !a) return;
  applyGroupResult(h, a, goalsHome, goalsAway);
}

function simulateCareerRound(myMatch) {
  const round = getCareerCurrentRound();
  round.forEach(match => {
    if (myMatch && match.home === myMatch.home && match.away === myMatch.away) return;
    const h = getStandingByName(match.home);
    const a = getStandingByName(match.away);
    if (!h || !a) return;
    const r = simAI({ ovr: h.ovr || 65 }, { ovr: a.ovr || 65 });
    applyGroupResult(h, a, r.h, r.a);
  });
}

function generateCareerOpponentTeam(opponentName) {
  const usedIds = new Set(getCareerPlayerList().map(p => p.id));
  const baseOvr = getStandingByName(opponentName)?.ovr || 65;
  const pool = shuffle(ALL_PLAYERS.filter(p => !usedIds.has(p.id)));
  let selected = pool.slice(0, CAREER_STARTERS);

  if (!selected.some(p => p.posicao_favorita === 'gk')) {
    const gk = pool.find(p => p.posicao_favorita === 'gk' && !selected.some(s => s.id === p.id));
    if (gk) selected[0] = gk;
  }

  return normalizeTeamForMatch(selected.map((p, index) => ({
    ...p,
    team: opponentName,
    ovr: clamp(baseOvr + Math.floor(Math.random() * 9) - 4 + (index === 0 && p.posicao_favorita === 'gk' ? 1 : 0), 50, 88),
    potential: p.potential || p.ovr
  })));
}

function healCareerInjuries() {
  Object.keys(career.injuries).forEach(id => {
    if (career.injuries[id] > 0) career.injuries[id]--;
    if (career.injuries[id] <= 0) delete career.injuries[id];
  });
}

function getInjuryChanceForPlayer(player) {
  let chance = CAREER_INJURY_CHANCE;
  if (typeof player.energy === 'number' && player.energy < 40) chance *= 1.6;
  if (typeof player.idade === 'number' && player.idade >= 30) chance *= 1.35;
  return chance;
}

function closeTransferWindowIfExpired() {
  if (!career.transferWindow) return;
  if (career.transferDeadline !== null && career.matchesPlayed >= career.transferDeadline) {
    career.transferWindow = false;
    career.transferPlayers = [];
    career.transferDeadline = null;
  }
}


function openCareerMode() {
  runWithLoading('Carregando modo carreira...', () => {
    const saved = localStorage.getItem('careerSave');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        document.getElementById('career-load-info').innerHTML = `
          <strong style="font-family:'Bebas Neue',cursive;font-size:20px;color:var(--purple);">${data.clubName}</strong><br>
          Temporada ${data.season} · Partida ${data.matchesPlayed + 1}/20<br>
          Jogador: ${data.player.name} · OVR ${data.player.ovr}<br>
          Moedas: ${data.coins} 🪙 · TP: ${data.trainingPoints}
        `;
        showScreen('career-load');
      } catch(e) {
        showScreen('career-create');
      }
    } else {
      showScreen('career-create');
    }
  });
}

function continueCareer() {
  try {
    const saved = JSON.parse(localStorage.getItem('careerSave'));
    migrateCareerSave(saved);
    renderCareerHub();
    showScreen('career-hub');
  } catch(e) {
    alert('Erro ao carregar carreira. Iniciando nova.');
    showScreen('career-create');
  }
}


function newCareerConfirm() {
  if (confirm('Tem certeza? O progresso atual será perdido.')) {
    localStorage.removeItem('careerSave');
    showScreen('career-create');
  }
}

function selectCareerPos(pos) {
  careerPlayerPos = pos;
  document.querySelectorAll('.career-pos-btn').forEach(btn => {
    btn.style.borderColor = 'var(--line)';
    btn.style.background = 'var(--card)';
    btn.style.color = 'var(--text)';
  });
  const sel = document.querySelector(`.career-pos-btn[data-pos="${pos}"]`);
  if (sel) {
    sel.style.borderColor = 'var(--purple)';
    sel.style.background = 'rgba(156,39,217,0.12)';
    sel.style.color = 'var(--purple)';
  }
}

function startCareerSetup() {
  const clubName = document.getElementById('career-club-name').value.trim() || 'Germinare FC';
  const playerName = document.getElementById('career-player-name').value.trim() || 'Jogador';
  const pos = careerPlayerPos || 'ata';

  const myPlayer = {
    id: 9999,
    name: playerName,
    team: clubName,
    ovr: CAREER_PLAYER_START_OVR,
    potential: 99,
    posicao_favorita: pos,
    isMyPlayer: true,
    xp: 0,
    level: 1,
    goals: 0,
    assists: 0,
    games: 0,
    mvps: 0,
    morale: 55,
    form: 0,
  };

  const standings = buildSeasonStandings(clubName);

  career = {
    version: 3,
    clubName,
    player: myPlayer,
    squad: [],
    bench: [],
    formation: { gk: null, s1: null, s2: null, s3: null, s4: null },
    coins: 0,
    xp: 0,
    trainingPoints: 0,
    season: 1,
    matchesPlayed: 0,
    standings,
    fixtures: buildSeasonFixtures(standings),
    injuries: {},
    achievements: [],
    history: [],
    seasonEnded: false,
    transferWindow: false,
    transferPlayers: [],
    transferDeadline: null,
    playerGoalsCareer: 0,
    playerAssistsCareer: 0,
    playerMvpsCareer: 0,
    scheme: 'quadrado',
  };

  careerDraftPicks = [myPlayer];
  state.careerDraftRound = 0;
  state.careerDraftPool = shuffle(ALL_PLAYERS);
  state.careerDraftPhase = 'starters';

  renderCareerDraft();
  showScreen('career-draft');
}


function buildSeasonStandings(myClub) {
  const teams = shuffle([...CAREER_AI_TEAMS]).slice(0, 11).map(name => ({
    name,
    pts: 0,
    w: 0,
    d: 0,
    l: 0,
    gf: 0,
    ga: 0,
    ovr: 58 + Math.floor(Math.random() * 18)
  }));
  teams.unshift({ name: myClub, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, isPlayer: true, ovr: 65 });
  return teams;
}


function renderCareerDraft() {
  const myP = career.player;
  document.getElementById('career-draft-my-name').textContent = myP.name;
  document.getElementById('career-draft-my-pos').textContent = POS_INFO[myP.posicao_favorita].label + ' · OVR 60';

  nextCareerDraftRound();
}

function nextCareerDraftRound() {
  const isStarters = state.careerDraftPhase === 'starters';
  const maxRounds = isStarters ? 5 : 3;
  
  if (state.careerDraftRound >= maxRounds) {
    // Switch phase or finish
    if (isStarters) {
      state.careerDraftPhase = 'bench';
      state.careerDraftRound = 0;
      nextCareerDraftRound();
      return;
    } else {
      // Finished drafting
      confirmCareerDraft();
      return;
    }
  }

  state.careerDraftRound++;
  const isStarters2 = state.careerDraftPhase === 'starters';
  const maxRounds2 = isStarters2 ? 5 : 3;
  const phaseLabel = isStarters2 ? 'TITULARES' : 'RESERVAS';
  document.getElementById('career-draft-round').textContent = `${phaseLabel} • ${state.careerDraftRound} de ${maxRounds2}`;

  // Get 5 random options
  const usedIds = new Set([...career.squad.map(p => p.id), ...career.bench.map(p => p.id), 9999]);
  const available = state.careerDraftPool.filter(p => !usedIds.has(p.id));
  const options = weightedSample(available, 5);

  const container = document.getElementById('career-draft-cards');
  container.innerHTML = '';
  container.classList.add('shuffling');

  options.forEach(p => {
    const baseP = { ...p, ovr: CAREER_PLAYER_START_OVR, potential: p.ovr };
    const rarity = getRarity(p.ovr); // rarity reflects real potential
    const pos = POS_INFO[baseP.posicao_favorita];
    const card = document.createElement('div');
    card.className = `player-card ${rarity.cssClass}`;
    card.innerHTML = `
      <span class="rarity-badge ${rarity.tier}">${rarity.label}</span>
      <div class="card-ovr ${rarity.colorClass}">${CAREER_PLAYER_START_OVR}</div>
      <div class="card-ovr-label">OVR</div>
      <div class="card-name">${baseP.name}</div>
      <div class="card-team">${baseP.team}</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:13px;letter-spacing:1px;opacity:0.75;margin:2px 0;">POT <span style="font-size:16px;opacity:1;">${p.ovr}</span></div>
      <div class="card-pos pos-${pos.cls}">${pos.icon} ${pos.label}<span class="card-pos-sub">posição favorita · +2 OVR</span></div>
    `;
    card.onclick = () => pickCareerDraftPlayer(baseP, card);
    container.appendChild(card);
  });

  setTimeout(() => container.classList.remove('shuffling'), 500);
  updateCareerDraftStatus();
}

function pickCareerDraftPlayer(player, cardEl) {
  const isStarters = state.careerDraftPhase === 'starters';
  
  if (isStarters) {
    career.squad.push(player);
  } else {
    career.bench.push(player);
  }

  cardEl.classList.add('picked');

  document.querySelectorAll('.player-card').forEach(c => {
    if (c !== cardEl) c.classList.add('dismissed');
    c.style.pointerEvents = 'none';
  });

  setTimeout(() => nextCareerDraftRound(), 700);
}

function updateCareerDraftStatus() {
  const s = career.squad.length;
  const b = career.bench.length;
  document.getElementById('career-draft-status').textContent = `Titulares: ${s}/5 | Reservas: ${b}/3`;
}

function confirmCareerDraft() {
  if (career.squad.length < 5 || career.bench.length < 3) {
    alert('Selecione 5 titulares e 3 reservas!');
    return;
  }
  // Ensure my player is in starters
  const myP = career.player;
  if (!career.squad.find(p => p.id === myP.id)) {
    career.squad.unshift(myP);
    if (career.squad.length > 5) career.squad.pop();
  }

  career.formation = getCareerFormationFromSquad();
  buildCareerFormation();
  renderCareerHub();
  showScreen('career-hub');
}

function buildCareerFormation() {
  ensureCareerFormationState();
  state.scheme = career.scheme || 'quadrado';
  state.formation = { gk: null, s1: null, s2: null, s3: null, s4: null };

  // Só os 3 melhores reservas entram no elenco ativo da partida.
  const activeBench = [...career.bench].sort((a, b) => b.ovr - a.ovr).slice(0, CAREER_BENCH);
  state.myPicks = [...career.squad, ...activeBench];

  const all = [...career.squad, ...activeBench];
  const entries = getCareerFormationEntries();
  const used = new Set();

  FORMATION_KEYS.forEach(key => {
    const p = entries[key];
    if (p && !isCareerPlayerInjured(p)) {
      state.formation[key] = p;
      used.add(String(p.id));
    }
  });

  const available = all.filter(p => p && !isCareerPlayerInjured(p) && !used.has(String(p.id)));
  const fallback = all.filter(p => p && isCareerPlayerInjured(p) && !used.has(String(p.id)));
  const reserves = [...available, ...fallback];

  if (all.filter(p => !isCareerPlayerInjured(p)).length < CAREER_STARTERS) {
    console.warn('Poucos jogadores disponíveis; alguns lesionados podem aparecer como emergência.');
  }

  FORMATION_KEYS.forEach(key => {
    if (state.formation[key]) return;
    const next = reserves.shift();
    if (next) state.formation[key] = next;
  });
}


function renderCareerHub() {
  ensureCareerSeasonState();
  const c = career;
  document.getElementById('career-hub-club').textContent = c.clubName;
  document.getElementById('career-coins-display').textContent = c.coins;
  document.getElementById('career-tp-display').textContent = c.trainingPoints;
  document.getElementById('career-season-label').textContent = `TEMPORADA ${c.season}`;
  document.getElementById('career-match-num').textContent = Math.min(c.matchesPlayed + 1, CAREER_MATCHES_PER_SEASON);

  const myTeam = c.standings.find(t => t.isPlayer);
  document.getElementById('career-pts-display').textContent = (myTeam ? myTeam.pts : 0) + ' pts';

  const p = c.player;
  document.getElementById('career-my-name-hub').textContent = p.name;
  document.getElementById('career-my-pos-hub').textContent = POS_INFO[p.posicao_favorita].label + ' · ' + c.clubName;
  document.getElementById('career-my-ovr-hub').textContent = p.ovr;

  const injured = Object.entries(c.injuries).filter(([id, turns]) => turns > 0);
  const injuryAlert = document.getElementById('career-injury-alert');
  if (injured.length > 0) {
    const names = injured.map(([id, turns]) => {
      const p = getCareerPlayerList().find(p => p.id == id);
      return p ? `${p.name} (${turns} partida${turns > 1 ? 's' : ''})` : '';
    }).filter(Boolean).join(', ');
    injuryAlert.style.display = 'block';
    injuryAlert.textContent = `🏥 Lesionados: ${names}`;
  } else {
    injuryAlert.style.display = 'none';
  }

  const transferAlert = document.getElementById('career-transfer-alert');
  transferAlert.style.display = c.transferWindow ? 'block' : 'none';
  if (c.transferWindow) {
    const left = c.transferDeadline !== null ? Math.max(0, c.transferDeadline - c.matchesPlayed) : '?';
    transferAlert.textContent = `🔔 Janela de Transferências aberta! Fecha em ${left} rodada${left === 1 ? '' : 's'}. Toque para ver.`;
  }

  const over = c.matchesPlayed >= CAREER_MATCHES_PER_SEASON;
  document.getElementById('career-play-btn').style.display = over ? 'none' : 'block';
}

// careerPlayMatch moved below

// careerPlayMatch moved below — pre-match screen version

// Hook into showResult for career mode
const _origShowResult = showResult;
showResult = function() {
  if (gameMode !== 'career') { _origShowResult(); return; }
  showCareerResult();
};

function showCareerResult() {
  ensureCareerSeasonState();
  const h = state.matchGoalsHome;
  const a = state.matchGoalsAway;
  const won = state.penalties ? state.penalties.winner === 'home' : h > a;
  const drew = !state.penalties && h === a;

  const banner = document.getElementById('career-result-banner');
  if (won) { banner.textContent = 'VITÓRIA!'; banner.className = 'result-banner win'; }
  else if (drew) { banner.textContent = 'EMPATE'; banner.className = 'result-banner draw'; }
  else { banner.textContent = 'DERROTA'; banner.className = 'result-banner lose'; }

  document.getElementById('career-result-score').textContent = `${h} x ${a}` + (state.penalties ? ` (Pen ${state.penalties.home}x${state.penalties.away})` : '');

  const homePlayers = Object.values(state.formation).filter(Boolean);
  const allPlayers = [...homePlayers, ...state.awayTeam].filter(Boolean);
  function ms(p) { return (state.playerGoals[p.id] || 0) * 2 + (state.playerAssists[p.id] || 0); }
  const maxS = Math.max(0, ...allPlayers.map(ms));
  const cands = maxS > 0 ? allPlayers.filter(p => ms(p) === maxS) : allPlayers;
  const mvp = cands[Math.floor(Math.random() * cands.length)] || career.player;
  const mvpGoals = state.playerGoals[mvp.id] || 0;
  const mvpAssists = state.playerAssists[mvp.id] || 0;
  const mvpParts = [];
  if (mvpGoals > 0) mvpParts.push(`${mvpGoals} gol${mvpGoals > 1 ? 's' : ''}`);
  if (mvpAssists > 0) mvpParts.push(`${mvpAssists} assist${mvpAssists > 1 ? 's' : ''}`);
  if (!mvpParts.length) mvpParts.push('destaque da partida');
  document.getElementById('career-result-mvp').innerHTML = `
    <div class="mvp-label">🏆 Craque da Partida</div>
    <div class="mvp-name">${mvp.name}</div>
    <div class="mvp-stat">${mvpParts.join(' • ')}</div>
  `;

  const myId = career.player.id;
  const myGoals = state.playerGoals[myId] || 0;
  const myAssists = state.playerAssists[myId] || 0;
  const isMvp = mvp.id === myId;
  const performanceBonus = Math.min(2, (myGoals > 0 ? 1 : 0) + (myAssists > 0 ? 1 : 0) + (isMvp ? 1 : 0));

  const coinReward = won ? CAREER_WIN_COINS : drew ? CAREER_DRAW_COINS : CAREER_LOSS_COINS;
  const baseTpReward = won ? CAREER_WIN_TP : drew ? CAREER_DRAW_TP : CAREER_LOSS_TP;
  const tpReward = baseTpReward + performanceBonus;

  career.coins += coinReward;
  career.trainingPoints += tpReward;

  const myMatch = state.currentCareerMatch || getCareerMyMatch();
  if (myMatch) {
    const userIsHomeInFixture = myMatch.home === career.clubName;
    const fixtureHomeGoals = userIsHomeInFixture ? h : a;
    const fixtureAwayGoals = userIsHomeInFixture ? a : h;
    applyCareerStandingResult(myMatch.home, myMatch.away, fixtureHomeGoals, fixtureAwayGoals);
    simulateCareerRound(myMatch);
  }

  career.player.goals = (career.player.goals || 0) + myGoals;
  career.player.assists = (career.player.assists || 0) + myAssists;
  career.player.games = (career.player.games || 0) + 1;
  if (isMvp) career.player.mvps = (career.player.mvps || 0) + 1;
  career.playerGoalsCareer = (career.playerGoalsCareer || 0) + myGoals;
  career.playerAssistsCareer = (career.playerAssistsCareer || 0) + myAssists;
  if (isMvp) career.playerMvpsCareer = (career.playerMvpsCareer || 0) + 1;

  healCareerInjuries();
  checkCareerInjuries(homePlayers);

  career.matchesPlayed++;
  closeTransferWindowIfExpired();

  if (career.matchesPlayed % CAREER_TRANSFER_WINDOW_INTERVAL === 0 && career.matchesPlayed < CAREER_MATCHES_PER_SEASON) {
    openTransferWindow();
  }

  if (career.matchesPlayed >= CAREER_MATCHES_PER_SEASON) career.seasonEnded = true;
  updateCareerClubOvr();
  saveCareer();

  const rewardsDiv = document.getElementById('career-result-rewards');
  rewardsDiv.innerHTML = `
    <div style="font-family:'Bebas Neue',cursive;font-size:18px;letter-spacing:2px;color:var(--green-dark);margin-bottom:6px;">RECOMPENSAS</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;">
      <div style="text-align:center;"><div style="font-family:'Bebas Neue',cursive;font-size:22px;color:var(--gold);">+${coinReward}</div><div style="font-size:10px;color:var(--text-muted);">MOEDAS</div></div>
      <div style="text-align:center;"><div style="font-family:'Bebas Neue',cursive;font-size:22px;color:var(--blue);">+${tpReward}</div><div style="font-size:10px;color:var(--text-muted);">TRAINING POINTS</div></div>
    </div>
    ${(myGoals || myAssists || isMvp) ? `<div style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:4px;">Bônus de estrela: +${performanceBonus} TP · ${myGoals} gol(s) · ${myAssists} assist(s)${isMvp ? ' · MVP' : ''}</div>` : ''}
  `;

  const detailsEl = document.getElementById('career-result-details');
  if (detailsEl) {
    const awayPlayers = (state.awayTeam || []).filter(Boolean);
    const rowFor = (p, isHome) => {
      const g = state.playerGoals[p.id] || 0;
      const as = state.playerAssists[p.id] || 0;
      const stats = [g > 0 ? `⚽${g}` : '', as > 0 ? `🅰️${as}` : ''].filter(Boolean).join(' ');
      const rating = calcPlayerRating(p, isHome);
      const rColor = ratingColor(rating);
      return `<div class="result-player-row">
        <span>${p.name}${p.id === 9999 ? ' ⭐' : ''}</span>
        <span style="display:flex;gap:8px;align-items:center;">
          ${stats ? `<span style="font-size:11px;color:var(--green-dark)">${stats}</span>` : ''}
          <span style="font-family:'Bebas Neue',cursive;font-size:15px;color:${rColor};min-width:28px;text-align:right;">${rating}</span>
        </span>
      </div>`;
    };
    detailsEl.innerHTML = `
      <div class="result-team-col">
        <h3>${career.clubName}</h3>
        ${homePlayers.map(p => rowFor(p, true)).join('')}
      </div>
      <div class="result-team-col">
        <h3>${state.awayName}</h3>
        ${awayPlayers.map(p => rowFor(p, false)).join('')}
      </div>
    `;
  }

  document.getElementById('career-result-events').innerHTML = document.getElementById('matchEvents').innerHTML;
  showScreen('career-result');
}

function checkCareerInjuries(playersUsed = []) {
  const played = (playersUsed && playersUsed.length ? playersUsed : Object.values(state.formation).filter(Boolean))
    .filter(p => p && !career.injuries[p.id]);

  played.forEach(p => {
    if (Math.random() < getInjuryChanceForPlayer(p)) {
      const turns = CAREER_INJURY_MIN_MATCHES + Math.floor(Math.random() * (CAREER_INJURY_MAX_MATCHES - CAREER_INJURY_MIN_MATCHES + 1));
      career.injuries[p.id] = turns;
    }
  });
}


function openTransferWindow() {
  const usedIds = new Set([...career.squad.map(p => p.id), ...career.bench.map(p => p.id), 9999]);
  const pool = shuffle(ALL_PLAYERS.filter(p => !usedIds.has(p.id)));
  career.transferPlayers = pool.slice(0, CAREER_TRANSFER_OPTIONS).map(p => ({
    ...p,
    ovr: Math.max(60, Math.floor(p.ovr * 0.75)),
    potential: p.ovr,
    price: CAREER_MIN_TRANSFER_PRICE + Math.floor(p.ovr * CAREER_TRANSFER_PRICE_MULTIPLIER)
  }));
  career.transferWindow = true;
  career.transferDeadline = career.matchesPlayed + CAREER_TRANSFER_WINDOW_DURATION;
}


function afterCareerMatch() {
  if (career.seasonEnded || career.matchesPlayed >= CAREER_MATCHES_PER_SEASON) {
    showCareerSeasonEnd();
    return;
  }
  renderCareerHub();
  renderCareerStandings();
  showScreen('career-hub');
  saveCareer();
}

function saveCareer(ev = null) {
  if (!career) return;
  ensureCareerSeasonState();
  localStorage.setItem('careerSave', JSON.stringify(career));

  const btn = ev?.target || (typeof window !== 'undefined' ? document.activeElement : null);
  if (btn && btn.tagName === 'BUTTON') {
    const orig = btn.textContent;
    btn.textContent = '✅ Salvo!';
    setTimeout(() => { if (btn) btn.textContent = orig; }, 1500);
  }
}

// Training Center

// Training Center
function renderTrainingCenter() {
  ensureCareerFormationState();
  document.getElementById('ct-tp-available').textContent = career.trainingPoints;
  const container = document.getElementById('ct-player-list');
  container.innerHTML = '';

  const starterIds = new Set(career.squad.map(p => String(p.id)));
  const starters = [...career.squad].sort((a, b) => b.ovr - a.ovr);
  const reserves = [...career.bench]
    .filter(p => !starterIds.has(String(p.id)))
    .sort((a, b) => b.ovr - a.ovr);

  const sectionHeader = (txt, color) => {
    const h = document.createElement('div');
    h.style.cssText = `grid-column:1/-1;font-family:'Bebas Neue',cursive;font-size:18px;letter-spacing:2px;color:${color};margin:6px 2px 0;border-bottom:1.5px solid var(--line);padding-bottom:4px;`;
    h.textContent = txt;
    container.appendChild(h);
  };

  const renderPlayerCard = (p) => {
    const isInjured = career.injuries[p.id] > 0;
    const pot = p.potential || 99;
    const cost = tpCost(p.ovr);
    const canTrain = p.ovr < pot && !isInjured && career.trainingPoints >= cost;
    const pos = POS_INFO[p.posicao_favorita];
    const pct = Math.round((p.ovr / pot) * 100);
    const isMaxed = p.ovr >= pot;
    const isMyPlayer = p.id === 9999;
    const isStarter = starterIds.has(String(p.id));
    const barColor = isMaxed ? 'var(--purple)' : pct >= 90 ? 'var(--gold)' : pct >= 70 ? 'var(--green)' : 'var(--blue)';

    const div = document.createElement('div');
    div.style.cssText = `
      background: linear-gradient(135deg, rgba(156,39,217,.07), rgba(255,255,255,.02));
      border: 1.5px solid ${isMyPlayer ? 'var(--purple)' : isInjured ? 'var(--red)' : 'var(--line)'};
      border-radius: 18px;
      padding: 20px 22px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: border-color 0.2s;
    `;

    div.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-weight:800;font-size:15px;">${p.name}${isMyPlayer ? ' ⭐' : ''}</span>
            <span class="pos-tag ${pos.cls}">${pos.icon} ${pos.cls.toUpperCase()}</span>
          </div>
          ${isInjured
            ? `<div style="font-size:11px;color:var(--red);font-weight:700;">🏥 Lesionado · ${career.injuries[p.id]} partida(s)</div>`
            : isMaxed
            ? `<div style="font-size:11px;color:var(--purple);font-weight:700;">✨ Potencial máximo atingido</div>`
            : `<div style="font-size:11px;color:var(--text-muted);">${isStarter ? 'Titular' : 'Reserva'} · Custo atual: ${cost} TP</div>`
          }
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-family:'Bebas Neue',cursive;font-size:38px;line-height:1;color:var(--text);">${p.ovr}</div>
          <div style="font-size:10px;letter-spacing:1px;color:var(--text-muted);">OVR</div>
        </div>
      </div>

      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:1px;">OVR ${p.ovr} / POT ${pot}</span>
          <span style="font-size:11px;font-weight:700;color:${barColor};">${pct}%</span>
        </div>
        <div style="background:var(--line);border-radius:6px;height:8px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:6px;transition:width 0.5s ease;"></div>
        </div>
      </div>

      <button
        ${canTrain ? '' : 'disabled'}
        onclick="trainPlayer(${p.id})"
        style="
          width:100%;padding:11px 0;border-radius:12px;border:none;
          cursor:${canTrain ? 'pointer' : 'not-allowed'};
          font-family:'Bebas Neue',cursive;font-size:16px;letter-spacing:1.5px;
          background:${canTrain ? 'var(--green)' : 'var(--line)'};
          color:${canTrain ? '#fff' : 'var(--text-muted)'};
          transition:all 0.2s;
          display:flex;align-items:center;justify-content:center;gap:8px;
        ">
        ${canTrain ? '▲ +1 OVR' : isMaxed ? 'POTENCIAL MÁXIMO' : isInjured ? 'LESIONADO' : 'TP INSUFICIENTE'}
        <span style="font-family:'Inter',sans-serif;font-size:11px;opacity:0.85;">${!isMaxed && !isInjured ? `· ${cost} TP` : ''}</span>
      </button>
    `;
    container.appendChild(div);
  };

  sectionHeader(`TITULARES (${starters.length})`, 'var(--green-dark)');
  starters.forEach(renderPlayerCard);

  if (reserves.length) {
    sectionHeader(`RESERVAS (${reserves.length})`, 'var(--blue)');
    reserves.forEach(renderPlayerCard);
  }
}


function trainPlayer(playerId) {
  const allPlayers = [...career.squad, ...career.bench];
  const p = allPlayers.find(x => x.id == playerId);
  if (!p) return;

  const cost = tpCost(p.ovr);
  if (career.trainingPoints < cost) {
    alert(`Sem Training Points suficientes! Este upgrade custa ${cost} TP.`);
    return;
  }
  if (career.injuries[p.id] > 0) { alert('Jogador lesionado!'); return; }
  const maxOvr = p.potential || 99;
  if (p.ovr >= maxOvr) { alert('Jogador no potencial máximo!'); return; }

  p.ovr = Math.min(maxOvr, p.ovr + 1);
  if (p.id === 9999) career.player.ovr = p.ovr;
  career.trainingPoints -= cost;
  updateCareerClubOvr();
  saveCareer();
  document.getElementById('ct-tp-available').textContent = career.trainingPoints;
  renderTrainingCenter();
  renderCareerHub();
}

// doTraining removed

// doTraining removed (no XP/level system)

function updateCareerProfileCard() {
  const p = career.player;
  const card = document.getElementById('career-profile-card');
  if (!card) return;
  const pos = POS_INFO[p.posicao_favorita];
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-family:'Bebas Neue',cursive;font-size:32px;letter-spacing:1px;">${p.name}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
          <span style="background:rgba(255,255,255,0.18);border-radius:8px;padding:3px 10px;font-size:12px;font-weight:700;">${pos.icon} ${pos.label}</span>
          <span style="font-size:12px;opacity:0.8;">${career.clubName}</span>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-family:'Bebas Neue',cursive;font-size:48px;line-height:1;">${p.ovr}</div>
        <div style="font-size:11px;letter-spacing:1px;opacity:0.7;">OVR</div>
      </div>
    </div>
    <div style="height:1px;background:rgba(255,255,255,0.15);"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;text-align:center;">
      <div style="padding:8px 0;">
        <div style="font-family:'Bebas Neue',cursive;font-size:28px;">${p.goals||0}</div>
        <div style="font-size:10px;letter-spacing:1px;opacity:0.7;">GOLS</div>
      </div>
      <div style="padding:8px 0;border-left:1px solid rgba(255,255,255,0.15);border-right:1px solid rgba(255,255,255,0.15);">
        <div style="font-family:'Bebas Neue',cursive;font-size:28px;">${p.assists||0}</div>
        <div style="font-size:10px;letter-spacing:1px;opacity:0.7;">ASSISTS</div>
      </div>
      <div style="padding:8px 0;">
        <div style="font-family:'Bebas Neue',cursive;font-size:28px;">${p.mvps||0}</div>
        <div style="font-size:10px;letter-spacing:1px;opacity:0.7;">MVPs</div>
      </div>
    </div>
    <div style="height:1px;background:rgba(255,255,255,0.15);"></div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0;text-align:center;">
      <div style="padding:8px 0;">
        <div style="font-family:'Bebas Neue',cursive;font-size:24px;">${p.games||0}</div>
        <div style="font-size:10px;letter-spacing:1px;opacity:0.7;">JOGOS</div>
      </div>
      <div style="padding:8px 0;border-left:1px solid rgba(255,255,255,0.15);">
        <div style="font-family:'Bebas Neue',cursive;font-size:24px;">T${career.season}</div>
        <div style="font-size:10px;letter-spacing:1px;opacity:0.7;">TEMPORADA</div>
      </div>
    </div>
  `;
}

function renderCareerStandings() {
  if (!career) return;
  document.getElementById('career-standings-season-label').textContent = `TEMPORADA ${career.season} · Partida ${career.matchesPlayed}/20`;
  const table = document.getElementById('career-standings-table');
  const sorted = [...career.standings].sort((a,b) => (b.pts-a.pts)||((b.gf-b.ga)-(a.gf-a.ga))||(b.gf-a.gf));
  table.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <tr style="color:var(--text-muted);font-weight:700;background:var(--bg);">
        <th style="text-align:left;padding:10px 12px;">#</th>
        <th style="text-align:left;padding:10px 6px;">Time</th>
        <th style="padding:8px 4px;text-align:center;">J</th>
        <th style="padding:8px 4px;text-align:center;">V</th>
        <th style="padding:8px 4px;text-align:center;">E</th>
        <th style="padding:8px 4px;text-align:center;">D</th>
        <th style="padding:8px 4px;text-align:center;">GF</th>
        <th style="padding:8px 4px;text-align:center;">GA</th>
        <th style="padding:8px 6px;text-align:center;">Pts</th>
      </tr>
      ${sorted.map((t,i) => `
        <tr style="${t.isPlayer?'font-weight:800;background:rgba(156,39,217,0.06);':''} border-bottom:1px solid var(--line);">
          <td style="padding:8px 12px;color:${i<3?'var(--green-dark)':'var(--text-muted)'};">${i+1}</td>
          <td style="padding:8px 6px;">${t.isPlayer?'⭐ ':''}${t.name}</td>
          <td style="text-align:center;padding:8px 4px;">${t.w+t.d+t.l}</td>
          <td style="text-align:center;padding:8px 4px;">${t.w}</td>
          <td style="text-align:center;padding:8px 4px;">${t.d}</td>
          <td style="text-align:center;padding:8px 4px;">${t.l}</td>
          <td style="text-align:center;padding:8px 4px;">${t.gf}</td>
          <td style="text-align:center;padding:8px 4px;">${t.ga}</td>
          <td style="text-align:center;padding:8px 6px;font-weight:700;">${t.pts}</td>
        </tr>`).join('')}
    </table>
  `;
}

function renderCareerTransfers() {
  document.getElementById('transfer-coins-display').textContent = career.coins;
  const container = document.getElementById('transfer-player-list');
  container.innerHTML = '';

  if (!career.transferPlayers || career.transferPlayers.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">Sem jogadores disponíveis no momento.</div>';
    return;
  }

  career.transferPlayers.forEach((p, idx) => {
    const pos = POS_INFO[p.posicao_favorita];
    const canBuy = career.coins >= p.price;
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:var(--shadow);';
    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="font-family:'Bebas Neue',cursive;font-size:32px;color:var(--text);">${p.ovr}</div>
        <div>
          <div style="font-weight:700;font-size:15px;">${p.name}</div>
          <span class="pos-tag ${pos.cls}">${pos.icon} ${pos.cls.toUpperCase()}</span>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Potencial: ${p.potential}</div>
        </div>
      </div>
      <button onclick="buyTransferPlayer(${idx})" ${canBuy?'':'disabled'}
        style="padding:10px 18px;border-radius:10px;border:none;cursor:${canBuy?'pointer':'not-allowed'};font-weight:700;font-size:13px;background:${canBuy?'var(--gold)':'var(--line)'};color:${canBuy?'#fff':'var(--text-muted)'};transition:all 0.2s;">
        COMPRAR<br><span style="font-size:11px;opacity:0.9;">💰 ${p.price}</span>
      </button>
    `;
    container.appendChild(div);
  });
}

function buyTransferPlayer(idx) {
  const p = career.transferPlayers[idx];
  if (!p) return;
  if (career.coins < p.price) { alert('Moedas insuficientes!'); return; }
  career.coins -= p.price;
  career.bench.push(p);
  career.transferPlayers.splice(idx, 1);
  career.transferWindow = career.transferPlayers.length > 0 && career.matchesPlayed < (career.transferDeadline ?? Infinity);
  renderCareerTransfers();
  renderCareerHub();
  alert(`${p.name} contratado! Confira o Centro de Treinamento para evoluí-lo.`);
}

function showCareerSeasonEnd() {
  const sorted = [...career.standings].sort((a,b)=>(b.pts-a.pts)||((b.gf-b.ga)-(a.gf-a.ga))||(b.gf-a.gf));
  const myPos = sorted.findIndex(t=>t.isPlayer) + 1;
  const myTeam = sorted.find(t=>t.isPlayer);
  const champion = sorted[0];
  const gd = (myTeam.gf || 0) - (myTeam.ga || 0);
  const campaignLabel = myPos === 1 ? 'TEMPORADA DE CAMPEÃO' : myPos <= 3 ? 'TEMPORADA HISTÓRICA' : myPos <= 6 ? 'TEMPORADA COMPETITIVA' : 'TEMPORADA DE APRENDIZADO';

  if (!career.history) career.history = [];
  if (!career.history.some(h => h.season === career.season)) {
    career.history.push({
      season: career.season,
      position: myPos,
      points: myTeam.pts,
      goals: career.playerGoalsCareer || 0,
      assists: career.playerAssistsCareer || 0,
      mvps: career.playerMvpsCareer || 0,
      finalOvr: career.player.ovr,
      champion: champion.name
    });
    saveCareer();
  }

  const content = document.getElementById('career-season-end-content');
  content.innerHTML = `
    <div style="background:linear-gradient(135deg,var(--purple),#6a0dad);border-radius:18px;padding:22px 24px;color:#fff;box-shadow:0 12px 30px rgba(156,39,217,.30);">
      <div style="font-size:11px;font-weight:800;letter-spacing:2px;opacity:.8;">${campaignLabel}</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:42px;line-height:1;margin-top:4px;">${myPos}º LUGAR</div>
      <div style="font-size:13px;opacity:.88;margin-top:6px;">${myTeam.pts} pontos · ${myTeam.w}V ${myTeam.d}E ${myTeam.l}D · SG ${gd >= 0 ? '+' : ''}${gd}</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
      <div style="background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:var(--shadow);">
        <div style="font-size:10px;color:var(--text-muted);font-weight:800;letter-spacing:2px;">GOLS</div>
        <div style="font-family:'Bebas Neue',cursive;font-size:34px;color:var(--green-dark);">${career.playerGoalsCareer || 0}</div>
      </div>
      <div style="background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:var(--shadow);">
        <div style="font-size:10px;color:var(--text-muted);font-weight:800;letter-spacing:2px;">ASSISTÊNCIAS</div>
        <div style="font-family:'Bebas Neue',cursive;font-size:34px;color:var(--blue);">${career.playerAssistsCareer || 0}</div>
      </div>
      <div style="background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:var(--shadow);">
        <div style="font-size:10px;color:var(--text-muted);font-weight:800;letter-spacing:2px;">MVPs</div>
        <div style="font-family:'Bebas Neue',cursive;font-size:34px;color:var(--gold);">${career.playerMvpsCareer || 0}</div>
      </div>
      <div style="background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:var(--shadow);">
        <div style="font-size:10px;color:var(--text-muted);font-weight:800;letter-spacing:2px;">OVR FINAL</div>
        <div style="font-family:'Bebas Neue',cursive;font-size:34px;color:var(--purple);">${career.player.ovr}</div>
      </div>
    </div>

    <div style="background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 20px;box-shadow:var(--shadow);">
      <div style="font-family:'Bebas Neue',cursive;font-size:16px;letter-spacing:2px;color:var(--green-dark);">TOP 3 DA LIGA</div>
      ${sorted.slice(0,3).map((t,i)=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px;${t.isPlayer?'font-weight:800;color:var(--purple);':''}"><span>${i+1}. ${t.isPlayer?'⭐ ':''}${t.name}</span><span>${t.pts} pts</span></div>`).join('')}
    </div>

    <div style="background:var(--gold-soft);border:1.5px solid var(--gold-bright);border-radius:16px;padding:14px 18px;color:var(--gold);font-weight:800;font-size:13px;">
      🏆 Campeão da temporada: ${champion.name}
    </div>
  `;

  if (myPos === 1) launchConfetti();
  showScreen('career-season-end');
}


function startNextSeason() {
  career.season++;
  career.matchesPlayed = 0;
  career.standings = buildSeasonStandings(career.clubName);
  career.fixtures = buildSeasonFixtures(career.standings);
  career.playerGoalsCareer = 0;
  career.playerAssistsCareer = 0;
  career.playerMvpsCareer = 0;
  career.transferWindow = false;
  career.transferPlayers = [];
  career.transferDeadline = null;
  career.injuries = {};
  career.seasonEnded = false;
  updateCareerClubOvr();
  saveCareer();
  renderCareerHub();
  showScreen('career-hub');
}
