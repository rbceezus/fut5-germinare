// ===================== CAMPEONATO ONLINE (CARREIRA) =====================
// Host é autoridade: monta um campeonato de pontos corridos (turno único)
// entre os times de carreira presentes (+ times CPU para completar), simula
// cada rodada e envia a cada jogador a sua própria partida para assistir,
// além da tabela atualizada.

const AI_CHAMP_NAMES = ['CPU United', 'CPU City', 'Robôs FC', 'Servidor SC', 'Bots Brasil'];

function makeAiChampTeam(i) {
  const pool = shuffle(ALL_PLAYERS).slice(0, 5).map(p => ({
    id: 'ai' + i + '_' + p.id, name: p.name, team: p.team,
    ovr: clamp(p.ovr - 5 + Math.floor(Math.random() * 8), 40, 92),
    posicao_favorita: p.posicao_favorita
  }));
  return { id: 'ai' + i, name: AI_CHAMP_NAMES[i % AI_CHAMP_NAMES.length] + (i >= AI_CHAMP_NAMES.length ? (' ' + i) : ''), ovr: avgOvr(pool), team: pool, isAi: true };
}

function startOnlineChampionship() {
  if (Online.role !== 'host') return;

  let teams = Online.members.map(m => ({ id: m.id, name: m.name, ovr: m.ovr, team: m.team, isAi: false }));
  let aiIdx = 0;
  while (teams.length < 4 || teams.length % 2 !== 0) {
    teams.push(makeAiChampTeam(aiIdx++));
  }

  teams.forEach(t => { t.pts = 0; t.w = 0; t.d = 0; t.l = 0; t.gf = 0; t.ga = 0; });
  const schedule = roundRobin(teams.length);   // array de rodadas; cada rodada = [[i,j],...]

  Online.champ = { teams, schedule, round: 0, total: schedule.length, lastTable: null };
  Online.phase = 'champ';
  broadcastRoster();
  playChampRound();
}

// Método do círculo para pontos corridos (turno único).
function roundRobin(n) {
  const idx = [...Array(n).keys()];
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = idx[i], b = idx[n - 1 - i];
      pairs.push([a, b]);
    }
    rounds.push(pairs);
    // rotaciona mantendo o primeiro fixo
    idx.splice(1, 0, idx.pop());
  }
  return rounds;
}

function champStandingsTable() {
  return [...Online.champ.teams]
    .sort((a, b) => (b.pts - a.pts) || ((b.gf - b.ga) - (a.gf - a.ga)) || (b.gf - a.gf))
    .map(t => ({ name: t.name, pts: t.pts, w: t.w, d: t.d, l: t.l, gf: t.gf, ga: t.ga, isAi: !!t.isAi, isMe: false, id: t.id }));
}

function applyChampResult(home, away, report) {
  const hg = report.homeGoals, ag = report.awayGoals;
  home.gf += hg; home.ga += ag; away.gf += ag; away.ga += hg;
  let hWin = report.penalties ? report.penalties.winner === 'home' : hg > ag;
  let draw = !report.penalties && hg === ag;
  if (draw) { home.pts++; away.pts++; home.d++; away.d++; }
  else if (hWin) { home.pts += 3; home.w++; away.l++; }
  else { away.pts += 3; away.w++; home.l++; }
}

function playChampRound() {
  const champ = Online.champ;
  const pairs = champ.schedule[champ.round];
  let hostMatch = null;

  pairs.forEach(([i, j]) => {
    const A = champ.teams[i], B = champ.teams[j];
    const report = OnlineSim.generate(A.team, B.team);
    applyChampResult(A, B, report);

    const sendTo = (member, youAreHome, opp) => {
      if (member.id === 'host') {
        hostMatch = { report, myTeam: member.team, oppTeam: opp.team, myName: member.name, oppName: opp.name, youAreHome };
      } else if (!member.isAi) {
        Net.send(member.id, {
          t: MSG.START, ctx: 'career', report, youAreHome,
          myTeam: member.team, myName: member.name,
          oppTeam: opp.team, oppName: opp.name,
        });
      }
    };
    sendTo(A, true, B);
    sendTo(B, false, A);
  });

  const table = champStandingsTable();
  champ.lastTable = table;
  Net.broadcast({ t: MSG.STANDINGS, table, round: champ.round + 1, totalRounds: champ.total });

  // host assiste a própria partida (se houver) e depois vê a tabela
  if (hostMatch) {
    OnlineSim.play(hostMatch.report, hostMatch.myTeam, hostMatch.oppTeam, hostMatch.myName, hostMatch.oppName, hostMatch.youAreHome,
      () => renderChampStandings(table, champ.round + 1, champ.total, true));
  } else {
    renderChampStandings(table, champ.round + 1, champ.total, true);
  }
}

function nextChampRound() {
  const champ = Online.champ;
  champ.round++;
  if (champ.round >= champ.schedule.length) {
    const table = champStandingsTable();
    const champion = table[0];
    Net.broadcast({ t: MSG.CHAMP_OVER, table, champion: champion ? champion.name : '' });
    renderChampOver(table, champion ? champion.name : '');
  } else {
    playChampRound();
  }
}

// ---- render (host e guest) ----
function renderChampStandings(table, round, total, isHost) {
  document.getElementById('champ-standings-title').textContent = `RODADA ${round} / ${total}`;
  document.getElementById('champ-standings-table').innerHTML = standingsHtml(table);
  const btn = document.getElementById('champ-next-btn');
  const wait = document.getElementById('champ-wait');
  if (isHost) {
    btn.style.display = 'block';
    btn.textContent = round >= total ? '🏆 Encerrar Campeonato' : 'Próxima Rodada →';
    btn.onclick = () => nextChampRound();
    wait.style.display = 'none';
  } else {
    btn.style.display = 'none';
    wait.style.display = 'block';
    wait.textContent = 'Aguardando o host iniciar a próxima rodada...';
  }
  showScreen('online-champ-standings');
}

function renderChampOver(table, champion) {
  document.getElementById('champ-over-name').textContent = '🏆 ' + champion;
  document.getElementById('champ-over-table').innerHTML = standingsHtml(table);
  showScreen('online-champ-over');
}

function standingsHtml(table) {
  return `<table style="width:100%;border-collapse:collapse;font-size:12px;">
    <tr style="color:var(--text-muted);font-weight:700;">
      <th style="text-align:left;padding:8px;">#</th><th style="text-align:left;padding:8px;">Time</th>
      <th>J</th><th>V</th><th>E</th><th>D</th><th>GF</th><th>GA</th><th>Pts</th>
    </tr>
    ${table.map((t, i) => `<tr style="border-bottom:1px solid var(--line);${t.isAi ? 'opacity:.7;' : 'font-weight:700;'}">
      <td style="padding:8px;color:${i < 3 ? 'var(--green-dark)' : 'var(--text-muted)'};">${i + 1}</td>
      <td style="padding:8px;">${t.isAi ? '🤖 ' : '👤 '}${t.name}</td>
      <td style="text-align:center;">${t.w + t.d + t.l}</td>
      <td style="text-align:center;">${t.w}</td><td style="text-align:center;">${t.d}</td><td style="text-align:center;">${t.l}</td>
      <td style="text-align:center;">${t.gf}</td><td style="text-align:center;">${t.ga}</td>
      <td style="text-align:center;font-weight:800;">${t.pts}</td></tr>`).join('')}
  </table>`;
}

// ---- handlers do guest ----
function onIncomingStandings(msg) {
  Online.champ = Online.champ || {};
  Online.champ.lastTable = msg.table;
  Online.champ.round = msg.round;
  Online.champ.total = msg.totalRounds;
  // só mostra a tabela se não estiver no meio de uma partida
  if (document.getElementById('online-champ-standings')) {
    renderChampStandings(msg.table, msg.round, msg.totalRounds, false);
  }
}

function onIncomingChampOver(msg) {
  renderChampOver(msg.table, msg.champion);
}
