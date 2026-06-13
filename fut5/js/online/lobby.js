// ===================== ONLINE LOBBY =====================

function openOnlineMenu() {
  Online.reset();
  document.getElementById('online-status').textContent = '';
  showScreen('online-menu');
}

function leaveOnline() {
  try { Net.close(); } catch (e) {}
  Online.reset();
  showScreen('splash');
}

// ---- montagem de times ----
function buildRandomOnlineTeam() {
  const gks = ALL_PLAYERS.filter(p => p.posicao_favorita === 'gk');
  const others = ALL_PLAYERS.filter(p => p.posicao_favorita !== 'gk');
  const gk = (weightedSample(gks, 1)[0]) || gks[0];
  const rest = weightedSample(others.filter(p => p.id !== gk.id), 4);
  return [gk, ...rest].map(p => ({ id: p.id, name: p.name, team: p.team, ovr: p.ovr, posicao_favorita: p.posicao_favorita }));
}

function careerOnlineTeam() {
  if (typeof career === 'undefined' || !career) return null;
  if (typeof ensureCareerFormationState === 'function') ensureCareerFormationState();
  const five = (career.squad || []).slice(0, 5)
    .map(p => ({ id: p.id, name: p.name, team: p.team, ovr: p.ovr, posicao_favorita: p.posicao_favorita }));
  return five.length === 5 ? five : null;
}

// ---- criar / entrar ----
function onlineCreate(mode) {
  let team;
  let label;
  if (mode === 'career') {
    team = careerOnlineTeam();
    if (!team) { alert('Você precisa de uma carreira com 5 titulares para jogar o campeonato online.'); return; }
    label = (career.clubName || 'Meu Clube');
  } else {
    team = buildRandomOnlineTeam();
    label = 'Você';
  }
  Online.active = true; Online.mode = mode; Online.role = 'host';
  Online.myName = label; Online.myTeam = team;
  Online.members = [{ id: 'host', name: label, ovr: avgOvr(team), team }];

  document.getElementById('online-status').textContent = 'Criando sala...';
  wireLobbyNet();
  Net.host().then(code => {
    renderLobby();
    showScreen('online-lobby');
  }).catch(() => {
    document.getElementById('online-status').textContent = 'Falha ao criar sala. Tente novamente (precisa de internet).';
  });
}

function onlineJoinPrompt(mode) {
  const code = (document.getElementById('online-join-code').value || '').toUpperCase().trim();
  if (code.length < 4) { document.getElementById('online-status').textContent = 'Digite o código da sala.'; return; }
  let team, label;
  if (mode === 'career') {
    team = careerOnlineTeam();
    if (!team) { alert('Você precisa de uma carreira com 5 titulares para entrar no campeonato online.'); return; }
    label = (career.clubName || 'Meu Clube');
  } else {
    team = buildRandomOnlineTeam();
    label = 'Você';
  }
  Online.active = true; Online.mode = mode; Online.role = 'guest';
  Online.myName = label; Online.myTeam = team;

  document.getElementById('online-status').textContent = 'Entrando na sala...';
  wireLobbyNet();
  Net.join(code).then(() => {
    // guest se apresenta ao host
    Net.toHost({ t: MSG.HELLO, name: label, ovr: avgOvr(team), team });
    showScreen('online-lobby');
    renderLobby();
  }).catch(() => {
    document.getElementById('online-status').textContent = 'Não foi possível entrar. Confira o código e a conexão.';
  });
}

// ---- rede da sala (membership) ----
let _lobbyWired = false;
function wireLobbyNet() {
  if (_lobbyWired) return; _lobbyWired = true;

  Net.on('_error', (msg) => {
    const el = document.getElementById('online-status');
    if (el) el.textContent = '⚠️ ' + msg;
  });

  Net.on('_leave', (peerId) => {
    if (Online.role === 'host') {
      Online.members = Online.members.filter(m => m.id !== peerId);
      broadcastRoster();
      renderLobby();
    }
  });

  // HOST recebe apresentação de um guest
  Net.on(MSG.HELLO, (msg, conn) => {
    if (Online.role !== 'host') return;
    if (!Online.members.some(m => m.id === conn.peer)) {
      Online.members.push({ id: conn.peer, name: msg.name || 'Jogador', ovr: msg.ovr || 60, team: msg.team || [] });
    }
    broadcastRoster();
    renderLobby();
  });

  // GUEST recebe lista de membros
  Net.on(MSG.ROSTER, (msg) => {
    Online.members = msg.players || [];
    Online.phase = msg.phase || 'lobby';
    renderLobby();
  });

  // mensagens de partida/campeonato (delegadas)
  Net.on(MSG.START, (msg) => onIncomingStart(msg));
  Net.on(MSG.STANDINGS, (msg) => onIncomingStandings(msg));
  Net.on(MSG.CHAMP_OVER, (msg) => onIncomingChampOver(msg));
  Net.on(MSG.WAIT, (msg) => {
    const el = document.getElementById('online-status');
    if (el) el.textContent = msg.text || '';
  });
}

function broadcastRoster() {
  const players = Online.members.map(m => ({ id: m.id, name: m.name, ovr: m.ovr }));
  Net.broadcast({ t: MSG.ROSTER, players, phase: Online.phase || 'lobby' });
}

function renderLobby() {
  document.getElementById('online-lobby-code').textContent = Net.code || '----';
  document.getElementById('online-lobby-mode').textContent =
    Online.mode === 'career' ? 'Campeonato Online (carreira)' : '1 x 1 Online';

  const list = document.getElementById('online-lobby-players');
  list.innerHTML = '';
  Online.members.forEach((m, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:10px 14px;';
    row.innerHTML = `
      <div style="font-family:'Bebas Neue',cursive;font-size:20px;min-width:30px;text-align:center;color:var(--blue);">${m.ovr || ''}</div>
      <div style="flex:1;font-weight:700;font-size:14px;">${m.name}${m.id === 'host' ? ' 👑' : ''}</div>
      <div style="font-size:11px;color:var(--text-muted);">${i === 0 ? 'host' : 'jogador'}</div>`;
    list.appendChild(row);
  });

  const startBtn = document.getElementById('online-lobby-start');
  const hint = document.getElementById('online-lobby-hint');
  if (Online.role === 'host') {
    const need = Online.mode === '1v1' ? 2 : 2;
    const ok = Online.members.length >= need;
    startBtn.style.display = 'block';
    startBtn.disabled = !ok;
    startBtn.style.opacity = ok ? '1' : '0.5';
    startBtn.textContent = Online.mode === '1v1'
      ? (ok ? '⚽ Iniciar Partida' : 'Aguardando adversário...')
      : (ok ? '🏆 Iniciar Campeonato' : 'Aguardando jogadores...');
    startBtn.onclick = () => {
      if (Online.mode === '1v1') startOnline1v1();
      else startOnlineChampionship();
    };
    hint.textContent = 'Compartilhe o código acima. ' +
      (Online.mode === 'career' ? 'Cada jogador entra com seu time da carreira. Mínimo 2.' : 'Quando o adversário entrar, inicie a partida.');
  } else {
    startBtn.style.display = 'none';
    hint.textContent = 'Aguardando o host iniciar...';
  }
}
