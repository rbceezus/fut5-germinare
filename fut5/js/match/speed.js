// ===================== VELOCIDADE DA PARTIDA =====================
const MATCH_SPEED_OPTIONS = [1, 2, 4];

function cycleMatchSpeed() {
  const cur = state.matchSpeed || 1;
  const next = MATCH_SPEED_OPTIONS[(MATCH_SPEED_OPTIONS.indexOf(cur) + 1) % MATCH_SPEED_OPTIONS.length];
  state.matchSpeed = next;
  syncMatchSpeedButtons();
}

function syncMatchSpeedButtons() {
  const label = '⏩ ' + (state.matchSpeed || 1) + 'x';
  document.querySelectorAll('.match-speed-btn').forEach(b => { b.textContent = label; });
}


function processMatchEvent(evt) {
  const container = document.getElementById('matchEvents');
  const div = document.createElement('div');
  div.className = 'match-event' + (evt.type === 'goal' ? ' goal-event' : '');

  const teamLabel = evt.isHome ? 'Sua Seleção' : state.awayName;
  const badgeClass = evt.isHome ? 'home' : 'away';
  const badge = `<span class="event-team-badge ${badgeClass}">${teamLabel}</span>`;
  let icon = '', text = '';

  switch (evt.type) {
    case 'goal':
      icon = '⚽';
      const assistLine = evt.assister ? ` <span style="font-size:11px;color:var(--text-muted);">🅰️ ${evt.assister.name}</span>` : '';
      const goalTexts = [
        `<strong>${evt.player.name}</strong> marca! GOLAÇO!`,
        `<strong>${evt.player.name}</strong> não perdoa! GOL!`,
        `<strong>${evt.player.name}</strong> manda pro fundo da rede!`,
        `<strong>${evt.player.name}</strong> amplia! Bola na rede!`,
        `<strong>${evt.player.name}</strong> fuzilou o goleiro!`,
      ];
      text = goalTexts[Math.floor(Math.random() * goalTexts.length)] + assistLine;
      state.playerGoals[evt.player.id] = (state.playerGoals[evt.player.id] || 0) + 1;
      if (evt.assister) {
        state.playerAssists[evt.assister.id] = (state.playerAssists[evt.assister.id] || 0) + 1;
      }
      if (evt.isHome) {
        state.matchGoalsHome++;
        document.getElementById('scoreHome').textContent = state.matchGoalsHome;
      } else {
        state.matchGoalsAway++;
        document.getElementById('scoreAway').textContent = state.matchGoalsAway;
      }
      break;
    case 'save':
      icon = '🧤';
      const saveTexts = [
        `QUE DEFESAÇA de <strong>${evt.player.name}</strong>!`,
        `<strong>${evt.player.name}</strong> FECHA O GOL! Mão santa!`,
        `MILAGRE! <strong>${evt.player.name}</strong> salva o time!`,
        `<strong>${evt.player.name}</strong> voa e espalma! Inacreditável!`,
      ];
      text = saveTexts[Math.floor(Math.random() * saveTexts.length)];
      break;
    case 'frango':
      icon = '🐔';
      const frangoTexts = [
        `<strong>${evt.player.name}</strong> FRANGOU! Que vergonha!`,
        `FRANGO! <strong>${evt.player.name}</strong> deixou passar entre as pernas!`,
        `<strong>${evt.player.name}</strong> entregou a bola! FRANGO MONUMENTAL!`,
        `A bola passou MANSA e <strong>${evt.player.name}</strong> só olhou!`,
      ];
      text = frangoTexts[Math.floor(Math.random() * frangoTexts.length)];
      if (evt.isHome) {
        state.matchGoalsAway++;
        document.getElementById('scoreAway').textContent = state.matchGoalsAway;
      } else {
        state.matchGoalsHome++;
        document.getElementById('scoreHome').textContent = state.matchGoalsHome;
      }
      break;
    case 'bolada':
      icon = '🤕';
      const boladaTexts = [
        `<strong>${evt.player.name}</strong> TOMOU UMA BOLADA NA CARA!`,
        `BOLADA! <strong>${evt.player.name}</strong> tá no chão vendo estrelas!`,
        `<strong>${evt.player.name}</strong> levou uma bomba na fuça! Aiii!`,
      ];
      text = boladaTexts[Math.floor(Math.random() * boladaTexts.length)];
      break;
    case 'isolou':
      icon = '🚀';
      const isolouTexts = [
        `<strong>${evt.player.name}</strong> ISOLOU NA RUA IRINEU JOSÉ BORDON!`,
        `<strong>${evt.player.name}</strong> mandou a bola pro estacionamento!`,
        `<strong>${evt.player.name}</strong> chutou pra fora do Espaço da Felicidade!`,
        `ISOLOU! <strong>${evt.player.name}</strong> mandou na lua!`,
      ];
      text = isolouTexts[Math.floor(Math.random() * isolouTexts.length)];
      break;
    case 'drible':
      const dribleIcons = { caneta: '🦵', chapeu: '🎩', elastico: '🌀', pedalada: '⚡' };
      const dribleTexts = {
        caneta: [
          `<strong>${evt.player.name}</strong> deu uma CANETA absurda! Sem vergonha!`,
          `CANETA! <strong>${evt.player.name}</strong> passou pelo buraquinho!`,
          `<strong>${evt.player.name}</strong> enfiou pelo buraquinho! CANETA LINDA!`,
        ],
        chapeu: [
          `<strong>${evt.player.name}</strong> deu um CHAPÉU! A galera foi à loucura!`,
          `CHAPÉU! <strong>${evt.player.name}</strong> levantou a bola por cima!`,
          `<strong>${evt.player.name}</strong> jogou por cima como se nada fosse! CHAPÉU!`,
        ],
        elastico: [
          `<strong>${evt.player.name}</strong> fez um ELÁSTICO desconcertante!`,
          `ELÁSTICO! <strong>${evt.player.name}</strong> deixou o cara sentado!`,
          `Que mágica de <strong>${evt.player.name}</strong>! ELÁSTICO sensacional!`,
        ],
        pedalada: [
          `PEDALADA! <strong>${evt.player.name}</strong> deixou o adversário tonto!`,
          `<strong>${evt.player.name}</strong> fez a bicicleta girar! PEDALADA!`,
          `Que fineza! <strong>${evt.player.name}</strong> aplicou a pedalada e sumiu!`,
        ],
      };
      icon = dribleIcons[evt.drible];
      text = dribleTexts[evt.drible][Math.floor(Math.random() * dribleTexts[evt.drible].length)];
      break;
    case 'yellow':
      icon = '🟨';
      text = `<strong>${evt.player.name}</strong> recebe amarelo`;
      break;
    case 'red':
      icon = '🟥';
      text = evt.secondYellow
        ? `<strong>${evt.player.name}</strong> recebe o segundo amarelo e está EXPULSO!`
        : `<strong>${evt.player.name}</strong> EXPULSO!`;
      break;
    case 'miss':
      icon = '💨';
      const missTexts = [
        `<strong>${evt.player.name}</strong> desperdiça chance!`,
        `<strong>${evt.player.name}</strong> perdeu gol feito!`,
        `<strong>${evt.player.name}</strong> chutou fraco nas mãos do goleiro!`,
      ];
      text = missTexts[Math.floor(Math.random() * missTexts.length)];
      break;
  }

  div.innerHTML = `
    <span class="event-time">${evt.min}'</span>
    <span class="event-icon">${icon}</span>
    ${badge}
    <span>${text}</span>
  `;

  container.insertBefore(div, container.firstChild);
}
