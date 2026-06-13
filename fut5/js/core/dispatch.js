// ===================== CONFIRM FORMATION (dispatch) =====================
function confirmFormation() {
  if (gameMode === 'cup') {
    setupCup();
  } else {
    startMatch();
  }
}
