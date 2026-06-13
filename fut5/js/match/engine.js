// ===================== MATCH =====================
function generateAwayTeam() {
  const used = new Set(state.myPicks.map(p => p.id));
  const available = ALL_PLAYERS.filter(p => !used.has(p.id));
  state.awayTeam = shuffle(available).slice(0, 5);
  state.awayName = TEAM_NAMES_AWAY[Math.floor(Math.random() * TEAM_NAMES_AWAY.length)];
}

function startMatch() {
  if (gameMode === 'quick') {
    generateAwayTeam();
    updateMatchTitle('AMISTOSO · MODO RÁPIDO');
  } else if (gameMode === 'career') {
    updateMatchTitle(`TEMPORADA ${career.season} · RODADA ${career.matchesPlayed + 1}`);
  } else if (gameMode === 'cup') {
    updateMatchTitle('COPA 26');
  }

  const homeEffective = Object.entries(state.formation).map(([slot, p]) => {
    if (!p) return p;
    return { ...p, matchSlot: slot, ovr: effectiveOvr(p, slot) };
  });

  const homeWithChem = homeEffective.map(player => {
    if (!player) return player;
    const chemBonus = getPlayerChemBonus(player, homeEffective.filter(Boolean));
    return { ...player, ovr: Math.min(99, player.ovr + chemBonus) };
  }).filter(Boolean);

  state.awayTeam = normalizeTeamForMatch(state.awayTeam);
  const homeAvg = avgOvr(homeWithChem);
  const awayAvg = avgOvr(state.awayTeam);

  state.homeEffective = homeWithChem;
  state.chemBonus = getChemistryInfo(state.formation).bonus;

  document.getElementById('teamHomeName').textContent = gameMode === 'career' && career ? career.clubName : 'SUA SELEÇÃO';
  document.getElementById('teamAwayName').textContent = state.awayName;
  document.getElementById('teamHomeOvr').textContent = `OVR ${homeAvg}`;
  document.getElementById('teamAwayOvr').textContent = `OVR ${awayAvg}`;
  document.getElementById('scoreHome').textContent = '0';
  document.getElementById('scoreAway').textContent = '0';
  document.getElementById('matchEvents').innerHTML = '';
  document.getElementById('matchProgress').style.width = '0%';

  state.matchGoalsHome = 0;
  state.matchGoalsAway = 0;
  state.matchEvents = [];
  state.playerGoals = {};
  state.playerAssists = {};
  state.redCards = new Set();
  state.yellowCards = {};
  state.teamHandicap = { home: 1, away: 1 };
  state.penalties = null;
  state.penState = null;

  showScreen('match');
  simulateMatch(homeWithChem, state.awayTeam, homeAvg, awayAvg);
}

function simulateMatch(home, away, homeAvg, awayAvg) {
  const eventMinutes = [];
  const numEvents = 12 + Math.floor(Math.random() * 8);
  const usedMinutes = new Set();

  for (let i = 0; i < numEvents; i++) {
    let m;
    do { m = 1 + Math.floor(Math.random() * 90); } while (usedMinutes.has(m));
    usedMinutes.add(m);
    eventMinutes.push(m);
  }
  eventMinutes.sort((a, b) => a - b);

  function ovrFactor(ovr) { return (clamp(ovr || 70, 1, 99) - 1) / 98; }

  function teamPower(team, side) {
    const active = getActiveTeam(team);
    if (!active.length) return 1;
    return avgOvr(active) * (state.teamHandicap[side] || 1);
  }

  function homeEventChance() {
    const homePower = teamPower(home, 'home');
    const awayPower = teamPower(away, 'away');
    const base = homePower / Math.max(1, homePower + awayPower);
    return clamp(base, 0.30, 0.70);
  }

  function goalProb(scorer, gk) {
    const attackBonus = ovrFactor(scorer?.ovr || 65) * 0.30;
    const gkPenalty = (1 - ovrFactor(gk?.ovr || 65)) * 0.20;
    return clamp(0.20 + attackBonus + gkPenalty, 0.08, 0.78);
  }

  function saveProb(gk) {
    return clamp(0.20 + ovrFactor(gk?.ovr || 65) * 0.42, 0.18, 0.72);
  }

  function frangoProb(gk) {
    return clamp(0.04 + (1 - ovrFactor(gk?.ovr || 65)) * 0.18, 0.02, 0.20);
  }

  function playerEventWeight(player, type, isHome) {
    let weight = Math.max(1, player.ovr || 60);
    if (gameMode === 'career' && isHome && career && player.id === career.player.id) {
      if (type === 'goal') weight *= 1.22;
      if (type === 'assist') weight *= 1.20;
      if (type === 'drible') weight *= 1.15;
    }
    return weight;
  }

  function chooseSide() {
    return Math.random() < homeEventChance();
  }

  function applyDiscipline(evt) {
    if (!evt || (evt.type !== 'yellow' && evt.type !== 'red') || !evt.player) return evt;
    const side = evt.isHome ? 'home' : 'away';

    if (evt.type === 'yellow') {
      state.yellowCards[evt.player.id] = (state.yellowCards[evt.player.id] || 0) + 1;
      if (state.yellowCards[evt.player.id] >= 2) {
        evt.type = 'red';
        evt.secondYellow = true;
      }
    }

    if (evt.type === 'red') {
      state.redCards.add(evt.player.id);
      state.teamHandicap[side] = Math.max(0.45, (state.teamHandicap[side] || 1) * 0.78);
    }
    return evt;
  }

  function createEvent(min) {
    const homeActive = getActiveTeam(home);
    const awayActive = getActiveTeam(away);
    if (!homeActive.length && !awayActive.length) return { min, type: 'miss', isHome: true, player: home[0] || away[0] };

    const r = Math.random();
    const isHome = chooseSide();
    const attackTeam = isHome ? homeActive : awayActive;
    const defendTeam = isHome ? awayActive : homeActive;
    const attackGK = getTeamGoalkeeper(attackTeam);
    const defendGK = getTeamGoalkeeper(defendTeam);
    const attackLine = attackTeam.filter(p => p.id !== attackGK?.id);
    const scorerPool = attackLine.length ? attackLine : attackTeam;

    if (r < 0.42) {
      const scorer = pickWeightedBy(scorerPool, p => playerEventWeight(p, 'goal', isHome));
      const prob = goalProb(scorer, defendGK);
      if (Math.random() < prob) {
        let assister = null;
        if (Math.random() < 0.72) {
          const assistPool = scorerPool.filter(p => p.id !== scorer?.id);
          assister = pickWeightedBy(assistPool, p => playerEventWeight(p, 'assist', isHome));
        }
        return { min, type: 'goal', isHome, player: scorer, assister };
      }
      if (Math.random() < saveProb(defendGK)) return { min, type: 'save', isHome: !isHome, player: defendGK };
      return { min, type: 'miss', isHome, player: scorer };
    }

    if (r < 0.50) {
      const sideHome = chooseSide();
      const team = sideHome ? homeActive : awayActive;
      const gk = getTeamGoalkeeper(team);
      if (Math.random() < frangoProb(gk)) return { min, type: 'frango', isHome: sideHome, player: gk };
      return { min, type: 'save', isHome: sideHome, player: gk };
    }

    if (r < 0.56) {
      const sideHome = chooseSide();
      const team = sideHome ? homeActive : awayActive;
      return { min, type: 'bolada', isHome: sideHome, player: pickWeightedBy(team, p => 100 - p.ovr) };
    }

    if (r < 0.70) {
      const sideHome = chooseSide();
      const team = sideHome ? homeActive : awayActive;
      return { min, type: 'isolou', isHome: sideHome, player: pickWeightedBy(team, p => Math.max(1, 105 - p.ovr)) };
    }

    if (r < 0.77) {
      const sideHome = chooseSide();
      const team = sideHome ? homeActive : awayActive;
      const dribles = ['caneta', 'chapeu', 'elastico', 'pedalada'];
      return {
        min,
        type: 'drible',
        isHome: sideHome,
        player: pickWeightedBy(team, p => playerEventWeight(p, 'drible', sideHome)),
        drible: dribles[Math.floor(Math.random() * dribles.length)]
      };
    }

    if (r < 0.86) {
      const sideHome = chooseSide();
      const team = sideHome ? homeActive : awayActive;
      const p = pickWeightedBy(team, p => Math.max(1, 100 - p.ovr));
      const directRed = Math.random() < 0.03;
      return { min, type: directRed ? 'red' : 'yellow', isHome: sideHome, player: p };
    }

    const sideHome = chooseSide();
    const team = sideHome ? homeActive : awayActive;
    return { min, type: 'miss', isHome: sideHome, player: pickWeightedBy(team, p => Math.max(1, 100 - p.ovr)) };
  }

  // Sincroniza o rótulo do botão de velocidade com o estado atual
  syncMatchSpeedButtons();

  // Playback por timer recursivo: lê state.matchSpeed a cada passo,
  // então acelerar/desacelerar tem efeito imediato no meio da partida.
  // Os eventos continuam sendo criados sob demanda (lazy) para que
  // expulsões alterem corretamente os eventos seguintes.
  let idx = 0;
  function playNextEvent() {
    const spd = state.matchSpeed || 1;

    if (idx >= eventMinutes.length) {
      state._matchTimer = setTimeout(() => {
        if (state.matchGoalsHome === state.matchGoalsAway && shouldGoToPenalties()) {
          simulatePenalties();
        } else {
          showResult();
        }
      }, 1500 / spd);
      return;
    }

    const evt = applyDiscipline(createEvent(eventMinutes[idx]));
    processMatchEvent(evt);
    idx++;
    document.getElementById('matchProgress').style.width = ((idx / eventMinutes.length) * 100) + '%';

    const wait = (1200 + Math.random() * 800) / (state.matchSpeed || 1);
    state._matchTimer = setTimeout(playNextEvent, wait);
  }

  state._matchTimer = setTimeout(playNextEvent, 800 / (state.matchSpeed || 1));
}
