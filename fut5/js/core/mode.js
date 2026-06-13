// ===================== GAME MODE =====================
let gameMode = 'quick'; // 'quick', 'cup' ou 'career'
let tournament = null;
let _cupMatch = null;
let _cupIsHome = true;

function startGame(mode) {
  const label = mode === 'cup' ? 'Carregando campeonato...' : 'Carregando partida rápida...';
  runWithLoading(label, () => {
    gameMode = mode;
    startDraft();
  });
}
