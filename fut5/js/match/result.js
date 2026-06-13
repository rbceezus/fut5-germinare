// ===================== RESULT =====================
function showResult() {
  const banner = document.getElementById('resultBanner');
  const score = document.getElementById('resultScore');
  const mvpDiv = document.getElementById('resultMvp');
  const details = document.getElementById('resultDetails');
  const trophyImg = document.getElementById('resultTrophy');

  const h = state.matchGoalsHome;
  const a = state.matchGoalsAway;

  let won = false;
  if (state.penalties) {
    won = state.penalties.winner === 'home';
  } else {
    won = h > a;
  }

  if (won) {
    banner.textContent = 'VITÓRIA!';
    banner.className = 'result-banner win';
    trophyImg.style.display = 'none';
  } else if (!state.penalties && h === a) {
    banner.textContent = 'EMPATE';
    banner.className = 'result-banner draw';
    trophyImg.style.display = 'none';
  } else {
    banner.textContent = 'DERROTA';
    banner.className = 'result-banner lose';
    trophyImg.style.display = 'none';
  }

  score.textContent = `${h} x ${a}` + (state.penalties ? ` (Pênaltis ${state.penalties.home}x${state.penalties.away})` : '');

  const homePlayers = Object.values(state.formation).filter(Boolean);
  const allPlayers = [...homePlayers, ...state.awayTeam].filter(Boolean);
  function mvpScore(p) {
    return (state.playerGoals[p.id] || 0) * 2 + (state.playerAssists[p.id] || 0);
  }
  const maxScore = Math.max(0, ...allPlayers.map(mvpScore));
  let candidates = maxScore > 0 ? allPlayers.filter(p => mvpScore(p) === maxScore) : allPlayers;
  let mvp = candidates[Math.floor(Math.random() * candidates.length)];
  const mvpGoals = state.playerGoals[mvp.id] || 0;
  const mvpAssists = state.playerAssists[mvp.id] || 0;
  const mvpStatParts = [];
  if (mvpGoals > 0) mvpStatParts.push(`${mvpGoals} gol${mvpGoals > 1 ? 's' : ''}`);
  if (mvpAssists > 0) mvpStatParts.push(`${mvpAssists} assist${mvpAssists > 1 ? 's' : ''}`);
  if (mvpStatParts.length === 0) mvpStatParts.push('destaque da partida');
  mvpDiv.innerHTML = `
    <div class="mvp-label">🏆 Craque da Final · Copa 26</div>
    <div class="mvp-name">${mvp.name}</div>
    <div class="mvp-stat">${mvpStatParts.join(' • ')} • ${mvp.team}</div>
  `;
  document.getElementById('resultEvents').innerHTML=document.getElementById('matchEvents').innerHTML;

  details.innerHTML = `
    <div class="result-team-col">
      <h3>Sua Seleção</h3>
      ${homePlayers.map(p => {
        const g = state.playerGoals[p.id] || 0;
        const a = state.playerAssists[p.id] || 0;
        const stats = [g > 0 ? `⚽${g}` : '', a > 0 ? `🅰️${a}` : ''].filter(Boolean).join(' ');
        const rating = calcPlayerRating(p, true);
        const rColor = ratingColor(rating);
        return `<div class="result-player-row">
          <span>${p.name}</span>
          <span style="display:flex;gap:8px;align-items:center;">
            ${stats ? `<span style="font-size:11px;color:var(--green-dark)">${stats}</span>` : ''}
            <span style="font-family:'Bebas Neue',cursive;font-size:15px;color:${rColor};min-width:28px;text-align:right;">${rating}</span>
          </span>
        </div>`;
      }).join('')}
      ${(state.chemBonus > 0) ? `<div style="margin-top:8px;font-size:10px;color:var(--green-dark);letter-spacing:1px;">🔗 Entrosamento +${state.chemBonus}</div>` : ''}
    </div>
    <div class="result-team-col">
      <h3>${state.awayName}</h3>
      ${state.awayTeam.map(p => {
        const g = state.playerGoals[p.id] || 0;
        const a = state.playerAssists[p.id] || 0;
        const stats = [g > 0 ? `⚽${g}` : '', a > 0 ? `🅰️${a}` : ''].filter(Boolean).join(' ');
        const rating = calcPlayerRating(p, false);
        const rColor = ratingColor(rating);
        return `<div class="result-player-row">
          <span>${p.name}</span>
          <span style="display:flex;gap:8px;align-items:center;">
            ${stats ? `<span style="font-size:11px;color:var(--green-dark)">${stats}</span>` : ''}
            <span style="font-family:'Bebas Neue',cursive;font-size:15px;color:${rColor};min-width:28px;text-align:right;">${rating}</span>
          </span>
        </div>`;
      }).join('')}
    </div>
  `;

  // Cup mode: adapt result button
  const resultBtn = document.getElementById('resultBtn');
  if (gameMode === 'cup' && tournament) {
    const t = tournament;
    if (t.phase === 'final' && won) {
      banner.textContent = 'CAMPEÃO DO MUNDO!';
      banner.className = 'result-banner win';
      trophyImg.style.display = 'block';
      resultBtn.textContent = 'Jogar Novamente';
      resultBtn.onclick = () => resetGame();
      launchConfetti();
    } else if (t.phase !== 'groups' && !won) {
      resultBtn.textContent = 'Continuar';
      resultBtn.onclick = () => cupAfterMatch();
    } else {
      resultBtn.textContent = 'Continuar';
      resultBtn.onclick = () => cupAfterMatch();
    }
  } else {
    resultBtn.textContent = 'Jogar novamente';
    resultBtn.onclick = () => resetGame();
    if (won) {
      trophyImg.style.display = 'block';
      banner.textContent = 'CAMPEÃO DO MUNDO!';
      launchConfetti();
    }
  }

  showScreen('result');
}


function simulatePenalties() {
  const homeGK = getTeamGoalkeeper(state.homeEffective || Object.values(state.formation).filter(Boolean));
  const awayGK = getTeamGoalkeeper(state.awayTeam);
  const homePlayers = (state.homeEffective || Object.values(state.formation).filter(Boolean)).filter(p => p && p.id !== homeGK?.id);
  const awayPlayers = (state.awayTeam || []).filter(p => p && p.id !== awayGK?.id);

  function penProb(kicker, gk) {
    const att = kicker ? (kicker.ovr - 1) / 98 : 0.5;
    const def = gk ? (gk.ovr - 1) / 98 : 0.5;
    return Math.max(0.30, Math.min(0.85, 0.60 + att * 0.18 - def * 0.14));
  }

  const homeKicks = [], awayKicks = [];
  let tempHome = 0, tempAway = 0;
  let rounds = 0;

  while (rounds < 5 || tempHome === tempAway) {
    const hKicker = homePlayers[rounds % Math.max(1, homePlayers.length)] || homeGK;
    const aKicker = awayPlayers[rounds % Math.max(1, awayPlayers.length)] || awayGK;
    const hScored = Math.random() < penProb(hKicker, awayGK);
    const aScored = Math.random() < penProb(aKicker, homeGK);
    homeKicks.push({ kicker: hKicker, scored: hScored });
    awayKicks.push({ kicker: aKicker, scored: aScored });
    if (hScored) tempHome++;
    if (aScored) tempAway++;
    rounds++;

    // Segurança: se ainda empatar demais, força uma última rodada decisiva.
    if (rounds >= 20 && tempHome === tempAway) {
      const hFinal = Math.random() < 0.5;
      homeKicks.push({ kicker: hKicker, scored: hFinal });
      awayKicks.push({ kicker: aKicker, scored: !hFinal });
      tempHome += hFinal ? 1 : 0;
      tempAway += hFinal ? 0 : 1;
      rounds++;
      break;
    }
  }

  state.penState = {
    homeKicks, awayKicks,
    hScore: 0, aScore: 0,
    totalRounds: rounds,
    currentStep: 0,
    dotsHome: [], dotsAway: [],
  };

  document.getElementById('penScoreHome').textContent = '0';
  document.getElementById('penScoreAway').textContent = '0';
  document.getElementById('penDotsHome').innerHTML = '';
  document.getElementById('penDotsAway').innerHTML = '';
  document.getElementById('penaltyEvents').innerHTML = '';
  document.getElementById('penAwayName').textContent = state.awayName;
  document.getElementById('penaltyTitle').textContent = 'DISPUTA DE PÊNALTIS';
  document.getElementById('penNextLabel').textContent = '';

  showScreen('penalty');
  schedulePenaltyKick();
}

function schedulePenaltyKick() {
  const ps = state.penState;
  const step = ps.currentStep;
  const kickIndex = Math.floor(step / 2);
  const isHome = (step % 2 === 0);

  if (kickIndex >= ps.totalRounds) {
    const winner = ps.hScore > ps.aScore ? 'home' : 'away';
    state.penalties = { home: ps.hScore, away: ps.aScore, winner };
    document.getElementById('penNextLabel').textContent = '';
    setTimeout(() => showResult(), 3000 / (state.matchSpeed || 1));
    return;
  }

  const kick = isHome ? ps.homeKicks[kickIndex] : ps.awayKicks[kickIndex];
  const teamLabel = isHome ? 'Sua Seleção' : state.awayName;
  const isSuddenDeath = kickIndex >= 5;
  document.getElementById('penNextLabel').textContent =
    (isSuddenDeath ? '⚡ MORTE SÚBITA — ' : '') + `${teamLabel}: ${kick.kicker.name} na bola...`;

  setTimeout(() => executePenaltyKick(kickIndex, isHome), 3500 / (state.matchSpeed || 1));
}

function executePenaltyKick(kickIndex, isHome) {
  const ps = state.penState;
  const kick = isHome ? ps.homeKicks[kickIndex] : ps.awayKicks[kickIndex];
  const scored = kick.scored;

  if (scored) {
    if (isHome) { ps.hScore++; document.getElementById('penScoreHome').textContent = ps.hScore; }
    else        { ps.aScore++; document.getElementById('penScoreAway').textContent = ps.aScore; }
  }

  const dot = document.createElement('span');
  dot.style.cssText = `
    display:inline-block;width:20px;height:20px;border-radius:50%;
    border:2px solid ${scored ? 'var(--green)' : 'var(--red)'};
    background:${scored ? 'var(--green)' : 'var(--red)'};
    transition:all 0.3s;
  `;
  document.getElementById(isHome ? 'penDotsHome' : 'penDotsAway').appendChild(dot);

  const container = document.getElementById('penaltyEvents');
  const div = document.createElement('div');
  div.className = 'match-event' + (scored ? ' goal-event' : '');
  const side = isHome ? 'Sua Seleção' : state.awayName;

  const goalPenTexts = [
    `<strong>${kick.kicker.name}</strong> (${side}) converte! ⚽`,
    `<strong>${kick.kicker.name}</strong> (${side}) não tremeu! Gol de pênalti!`,
    `<strong>${kick.kicker.name}</strong> (${side}) bateu no canto e marcou!`,
  ];
  const missPenTexts = [
    `<strong>${kick.kicker.name}</strong> (${side}) parou no goleiro! 🧤`,
    `<strong>${kick.kicker.name}</strong> (${side}) isolou na cobrança! 🚀`,
    `<strong>${kick.kicker.name}</strong> (${side}) bateu na trave! 😬`,
  ];
  const texts = scored ? goalPenTexts : missPenTexts;
  div.innerHTML = `
    <span class="event-icon">${scored ? '⚽' : '❌'}</span>
    <span>${texts[Math.floor(Math.random() * texts.length)]}</span>
  `;
  container.insertBefore(div, container.firstChild);

  ps.currentStep++;
  document.getElementById('penNextLabel').textContent = '';

  const spd = state.matchSpeed || 1;
  const decided = penaltyShootoutWinner(ps);
  if (decided) {
    state.penalties = { home: ps.hScore, away: ps.aScore, winner: decided };
    setTimeout(() => showResult(), 2500 / spd);
    return;
  }

  schedulePenaltyKick();
}

// Retorna 'home'/'away' assim que a disputa estiver matematicamente decidida, senão null.
function penaltyShootoutWinner(ps) {
  const homeTaken = Math.ceil(ps.currentStep / 2);
  const awayTaken = Math.floor(ps.currentStep / 2);
  const inRegulation = homeTaken < 5 || awayTaken < 5;

  if (inRegulation) {
    // Encerra cedo se o adversário não tem mais como alcançar (ex.: 3x0 com 2 cobranças restantes).
    const remHome = Math.max(0, 5 - homeTaken);
    const remAway = Math.max(0, 5 - awayTaken);
    if (ps.hScore > ps.aScore + remAway) return 'home';
    if (ps.aScore > ps.hScore + remHome) return 'away';
    return null;
  }

  // Morte súbita: só decide quando os dois bateram o mesmo número de cobranças.
  if (homeTaken === awayTaken && ps.hScore !== ps.aScore) {
    return ps.hScore > ps.aScore ? 'home' : 'away';
  }
  return null;
}

function canEndEarly(ps, roundsDone) {
  return ps.currentStep % 2 === 0 && ps.hScore !== ps.aScore && roundsDone >= 5;
}


function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#00a651', '#0057b7', '#c8102e', '#ffc62e', '#ffffff'];

  for (let i = 0; i < 90; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2 + Math.random() * 3) + 's';
    piece.style.animationDelay = Math.random() * 2 + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (6 + Math.random() * 8) + 'px';
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 6000);
}

function resetGame() {
  state.scheme = 'quadrado';
  state.formation = { gk: null, s1: null, s2: null, s3: null, s4: null };
  state.selectedBenchPlayer = null;
  gameMode = 'quick';
  tournament = null;
  showScreen('splash');
}
