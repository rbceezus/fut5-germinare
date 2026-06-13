// ===================== CHEMISTRY

// ===================== CHEMISTRY & BUFF SYSTEMS =====================

// Retorna o OVR efetivo de um jogador numa determinada slot (buff de posição = +2)
function effectiveOvr(player, slotKey) {
  return getMatchEffectiveOvr(player, slotKey);
}

// +1 OVR médio

// +1 OVR médio por par de jogadores com o mesmo time (máx +5)
function chemistryBonus(players) {
  const teamCount = {};

  players.forEach(p => {
    if (p) teamCount[p.team] = (teamCount[p.team] || 0) + 1;
  });

  let bonus = 0;

  Object.values(teamCount).forEach(count => {
    if (count >= 2) {
      bonus += count; // +1 por jogador do time
    }
  });

  return Math.min(5, bonus); // máximo +5
}

function getDisplayOvr(player){

  const formationEntries = Object.entries(state.formation || {});

  const entry = formationEntries.find(([_, p]) =>
    p && p.id === player.id
  );

  const slotKey = entry ? entry[0] : null;

  const positionBonus =
    slotKey
      ? effectiveOvr(player, slotKey) - player.ovr
      : 0;

  const formationPlayers =
    Object.values(state.formation || {}).filter(Boolean);

  const sameTeamPlayers =
    formationPlayers.filter(p => p.team === player.team);

  let chemBonus = 0;

  if (sameTeamPlayers.length >= 2) {
    chemBonus = Math.min(5, sameTeamPlayers.length);
  }

  const totalBonus = positionBonus + chemBonus;

  return {
    finalOvr: Math.min(99, player.ovr + totalBonus),
    positionBonus,
    chemBonus,
    totalBonus
  };
}

function getPlayerChemBonus(player, players) {
  const sameTeamPlayers = players.filter(
    p => p && p.team === player.team
  );

  if (sameTeamPlayers.length < 2) return 0;

  return Math.min(5, sameTeamPlayers.length);
}

function getChemistryInfo(formation) {
  const players = Object.values(formation).filter(Boolean);
  const bonus = chemistryBonus(players);
  const teamCount = {};
  players.forEach(p => { teamCount[p.team] = (teamCount[p.team] || 0) + 1; });
  const combos = Object.entries(teamCount)
    .filter(([,c]) => c > 1)
    .map(([t,c]) => `${c}x ${t}`);
  return { bonus, combos };
}

function calcPlayerRating(player, isHome) {
  const goals = state.playerGoals[player.id] || 0;
  const assists = state.playerAssists[player.id] || 0;
  const teamWon = isHome
    ? (state.penalties ? state.penalties.winner === 'home' : state.matchGoalsHome > state.matchGoalsAway)
    : (state.penalties ? state.penalties.winner === 'away' : state.matchGoalsAway > state.matchGoalsHome);
  const drew = !state.penalties && state.matchGoalsHome === state.matchGoalsAway;

  let base = 4.5 + (player.ovr - 50) * 0.04;
  base += goals * 1.5;
  base += assists * 0.8;
  if (teamWon) base += 0.8;
  if (drew) base += 0.2;
  base += (Math.random() - 0.5);
  return Math.min(10, Math.max(1, Math.round(base * 10) / 10));
}

function ratingColor(r) {
  if (r >= 8.5) return '#d98e00';
  if (r >= 7.0) return '#00813f';
  if (r >= 5.5) return '#64748b';
  return '#c8102e';
}
