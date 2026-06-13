// ===================== ONLINE 1x1 =====================

function startOnline1v1() {
  if (Online.role !== 'host') return;
  const me = Online.members[0];                 // host
  const opp = Online.members.find(m => m.id !== 'host');
  if (!opp) return;

  const report = OnlineSim.generate(me.team, opp.team);

  // adversário (guest) recebe a partida na perspectiva dele
  Net.send(opp.id, {
    t: MSG.START, ctx: '1v1',
    report,
    youAreHome: false,
    myTeam: opp.team, myName: opp.name,
    oppTeam: me.team, oppName: me.name,
  });

  // host joga localmente como "home"
  Online.current = { ctx: '1v1' };
  OnlineSim.play(report, me.team, opp.team, me.name, opp.name, true, () => {
    showScreen('online-lobby');
    renderLobby();
  });
}

// Recebido por um cliente quando o host envia uma partida para ele jogar/assistir.
function onIncomingStart(msg) {
  const onDone = () => {
    if (msg.ctx === 'career') {
      // volta para a tela de classificação/espera
      if (Online.champ && Online.champ.lastTable) renderChampStandings(Online.champ.lastTable, Online.champ.round, Online.champ.total, false);
      else showScreen('online-champ-standings');
    } else {
      showScreen('online-lobby');
      renderLobby();
    }
  };
  OnlineSim.play(msg.report, msg.myTeam, msg.oppTeam, msg.myName, msg.oppName, msg.youAreHome, onDone);
}
