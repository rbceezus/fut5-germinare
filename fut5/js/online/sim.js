// ===================== ONLINE MATCH SIM =====================
// O host gera um "relatório" determinístico da partida (lista de eventos +
// placar + pênaltis). Ambos os jogadores reproduzem o mesmo relatório,
// reaproveitando o renderer de eventos da partida (processMatchEvent).

const OnlineSim = (() => {

  function ovrF(o) { return (clamp(o || 65, 1, 99) - 1) / 98; }

  function pick(pool, wf) {
    const valid = (pool || []).filter(Boolean);
    if (!valid.length) return null;
    const ws = valid.map(p => Math.max(1, wf(p)));
    const tot = ws.reduce((s, w) => s + w, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < valid.length; i++) { r -= ws[i]; if (r <= 0) return valid[i]; }
    return valid[valid.length - 1];
  }

  // Gera o relatório canônico: home vs away (arrays de 5 jogadores).
  function generate(home, away) {
    const homeGK = home.find(p => p.posicao_favorita === 'gk') || home[0];
    const awayGK = away.find(p => p.posicao_favorita === 'gk') || away[0];

    const goalProb = (s, gk) => clamp(0.20 + ovrF(s && s.ovr) * 0.30 + (1 - ovrF(gk && gk.ovr)) * 0.20, 0.08, 0.78);
    const saveProb = (gk) => clamp(0.20 + ovrF(gk && gk.ovr) * 0.42, 0.18, 0.72);
    const frangoProb = (gk) => clamp(0.04 + (1 - ovrF(gk && gk.ovr)) * 0.18, 0.02, 0.20);

    const n = 12 + Math.floor(Math.random() * 8);
    const used = new Set(), mins = [];
    while (mins.length < n) { const m = 1 + Math.floor(Math.random() * 90); if (!used.has(m)) { used.add(m); mins.push(m); } }
    mins.sort((a, b) => a - b);

    const homePow = avgOvr(home), awayPow = avgOvr(away);
    const homeChance = clamp(homePow / Math.max(1, homePow + awayPow), 0.30, 0.70);

    const red = new Set(), yc = {};
    const act = team => team.filter(p => !red.has(p.id));
    let hg = 0, ag = 0;
    const events = [];

    for (const min of mins) {
      const r = Math.random();
      const isHome = Math.random() < homeChance;
      const atk = act(isHome ? home : away);
      const atkGK = isHome ? homeGK : awayGK;
      const dfdGK = isHome ? awayGK : homeGK;
      const line = atk.filter(p => p.id !== (atkGK && atkGK.id));
      const pool = line.length ? line : atk;
      let evt;

      if (r < 0.42) {
        const sc = pick(pool, p => p.ovr);
        if (sc && Math.random() < goalProb(sc, dfdGK)) {
          let as = null;
          if (Math.random() < 0.72) { const ap = pool.filter(p => p.id !== sc.id); as = pick(ap, p => p.ovr); }
          evt = { min, type: 'goal', isHome, player: sc, assister: as };
          if (isHome) hg++; else ag++;
        } else if (Math.random() < saveProb(dfdGK)) {
          evt = { min, type: 'save', isHome: !isHome, player: dfdGK };
        } else {
          evt = { min, type: 'miss', isHome, player: sc || atk[0] };
        }
      } else if (r < 0.50) {
        const gk = isHome ? homeGK : awayGK;
        if (Math.random() < frangoProb(gk)) { evt = { min, type: 'frango', isHome, player: gk }; if (isHome) ag++; else hg++; }
        else evt = { min, type: 'save', isHome, player: gk };
      } else if (r < 0.56) {
        evt = { min, type: 'bolada', isHome, player: pick(atk, p => 100 - p.ovr) };
      } else if (r < 0.70) {
        evt = { min, type: 'isolou', isHome, player: pick(atk, p => Math.max(1, 105 - p.ovr)) };
      } else if (r < 0.77) {
        const dribles = ['caneta', 'chapeu', 'elastico', 'pedalada'];
        evt = { min, type: 'drible', isHome, player: pick(atk, p => p.ovr), drible: dribles[Math.floor(Math.random() * 4)] };
      } else if (r < 0.86) {
        const p = pick(atk, p => Math.max(1, 100 - p.ovr));
        let type = Math.random() < 0.03 ? 'red' : 'yellow';
        if (p && type === 'yellow') { yc[p.id] = (yc[p.id] || 0) + 1; if (yc[p.id] >= 2) type = 'red'; }
        if (p && type === 'red') red.add(p.id);
        evt = { min, type, isHome, player: p };
      } else {
        evt = { min, type: 'miss', isHome, player: pick(atk, p => Math.max(1, 100 - p.ovr)) };
      }
      if (evt && evt.player) events.push(evt);
    }

    let penalties = null;
    if (hg === ag) penalties = generatePens(home, away, homeGK, awayGK);

    return { events, homeGoals: hg, awayGoals: ag, penalties };
  }

  function generatePens(home, away, homeGK, awayGK) {
    const hp = home.filter(p => p.id !== (homeGK && homeGK.id));
    const ap = away.filter(p => p.id !== (awayGK && awayGK.id));
    const prob = (k, gk) => clamp(0.60 + ovrF(k && k.ovr) * 0.18 - ovrF(gk && gk.ovr) * 0.14, 0.30, 0.85);
    let h = 0, a = 0, round = 0;
    while (round < 5 || h === a) {
      const hk = hp[round % Math.max(1, hp.length)] || homeGK;
      const ak = ap[round % Math.max(1, ap.length)] || awayGK;
      if (Math.random() < prob(hk, awayGK)) h++;
      if (Math.random() < prob(ak, homeGK)) a++;
      round++;
      if (round >= 20 && h === a) { (Math.random() < 0.5 ? h++ : a++); break; }
    }
    return { home: h, away: a, winner: h > a ? 'home' : 'away' };
  }

  function flip(report) {
    return {
      events: report.events.map(e => Object.assign({}, e, { isHome: !e.isHome })),
      homeGoals: report.awayGoals,
      awayGoals: report.homeGoals,
      penalties: report.penalties ? {
        home: report.penalties.away, away: report.penalties.home,
        winner: report.penalties.winner === 'home' ? 'away' : 'home'
      } : null
    };
  }

  // Reproduz o relatório na tela de partida, sempre na perspectiva local
  // (jogador local = "home"). onDone recebe 'win'|'lose'.
  function play(report, myTeam, oppTeam, myName, oppName, youAreHome, onDone) {
    const r = youAreHome ? report : flip(report);

    state.awayName = oppName;
    state.matchGoalsHome = 0; state.matchGoalsAway = 0;
    state.playerGoals = {}; state.playerAssists = {};
    state.penalties = r.penalties || null;

    document.getElementById('teamHomeName').textContent = myName;
    document.getElementById('teamAwayName').textContent = oppName;
    document.getElementById('teamHomeOvr').textContent = 'OVR ' + avgOvr(myTeam);
    document.getElementById('teamAwayOvr').textContent = 'OVR ' + avgOvr(oppTeam);
    document.getElementById('scoreHome').textContent = '0';
    document.getElementById('scoreAway').textContent = '0';
    document.getElementById('matchEvents').innerHTML = '';
    document.getElementById('matchProgress').style.width = '0%';
    if (typeof updateMatchTitle === 'function') updateMatchTitle('PARTIDA ONLINE · ' + myName + ' x ' + oppName);
    if (typeof syncMatchSpeedButtons === 'function') syncMatchSpeedButtons();

    showScreen('match');

    let i = 0;
    const step = () => {
      const spd = state.matchSpeed || 1;
      if (i >= r.events.length) {
        setTimeout(() => showOnlineResult(r, myTeam, oppTeam, myName, oppName, onDone), 1200 / spd);
        return;
      }
      processMatchEvent(r.events[i]);
      i++;
      document.getElementById('matchProgress').style.width = ((i / r.events.length) * 100) + '%';
      setTimeout(step, (1100 + Math.random() * 700) / (state.matchSpeed || 1));
    };
    setTimeout(step, 700 / (state.matchSpeed || 1));
  }

  function showOnlineResult(r, myTeam, oppTeam, myName, oppName, onDone) {
    const h = state.matchGoalsHome, a = state.matchGoalsAway;
    let iWon = r.penalties ? r.penalties.winner === 'home' : h > a;
    let drew = !r.penalties && h === a;

    const banner = document.getElementById('online-result-banner');
    if (iWon) { banner.textContent = 'VITÓRIA!'; banner.className = 'result-banner win'; }
    else if (drew) { banner.textContent = 'EMPATE'; banner.className = 'result-banner draw'; }
    else { banner.textContent = 'DERROTA'; banner.className = 'result-banner lose'; }

    document.getElementById('online-result-score').textContent =
      `${h} x ${a}` + (r.penalties ? ` (Pen ${r.penalties.home}x${r.penalties.away})` : '');

    const rowFor = (p, isHome) => {
      const g = state.playerGoals[p.id] || 0, as = state.playerAssists[p.id] || 0;
      const stats = [g > 0 ? `⚽${g}` : '', as > 0 ? `🅰️${as}` : ''].filter(Boolean).join(' ');
      const rating = calcPlayerRating(p, isHome), rColor = ratingColor(rating);
      return `<div class="result-player-row"><span>${p.name}</span>
        <span style="display:flex;gap:8px;align-items:center;">
          ${stats ? `<span style="font-size:11px;color:var(--green-dark)">${stats}</span>` : ''}
          <span style="font-family:'Bebas Neue',cursive;font-size:15px;color:${rColor};min-width:28px;text-align:right;">${rating}</span>
        </span></div>`;
    };
    document.getElementById('online-result-details').innerHTML = `
      <div class="result-team-col"><h3>${myName}</h3>${myTeam.map(p => rowFor(p, true)).join('')}</div>
      <div class="result-team-col"><h3>${oppName}</h3>${oppTeam.map(p => rowFor(p, false)).join('')}</div>`;
    document.getElementById('online-result-events').innerHTML = document.getElementById('matchEvents').innerHTML;

    const btn = document.getElementById('online-result-btn');
    btn.onclick = () => { if (onDone) onDone(iWon ? 'win' : (drew ? 'draw' : 'lose')); };
    showScreen('online-result');
  }

  return { generate, flip, play };
})();
