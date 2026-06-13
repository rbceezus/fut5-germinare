// ===================== ONLINE PROTOCOL =====================
// Tipos de mensagem trafegados entre host e jogadores.
const MSG = {
  HELLO:      'hello',       // guest -> host  { name, team:[players] }
  ROSTER:     'roster',      // host  -> todos { players:[{id,name,ovr,count}] , phase }
  START:      'startMatch',  // host  -> 2 jogadores { report, home, away, youAreHome, label }
  RESULT:     'matchResult', // guest -> host  { homeGoals, awayGoals, penalties }
  STANDINGS:  'standings',   // host  -> todos { table, round, totalRounds, fixtures }
  CHAMP_OVER: 'champOver',   // host  -> todos { table, champion }
  WAIT:       'wait',        // host  -> todos { text }
  KICK:       'kick',        // host  -> todos { reason }
};

// Estado compartilhado do modo online (vive no cliente local).
const Online = {
  active: false,
  mode: null,        // '1v1' | 'career'
  role: null,        // 'host' | 'guest'
  myName: '',
  myTeam: [],        // 5 jogadores que represento
  members: [],       // [{id,name,ovr}] (host conhece todos)
  current: null,     // contexto da partida em andamento
  champ: null,       // estado do campeonato (host)
  onMatchDone: null,
  reset() {
    this.active = false; this.mode = null; this.role = null;
    this.myTeam = []; this.members = []; this.current = null;
    this.champ = null; this.onMatchDone = null;
  }
};
