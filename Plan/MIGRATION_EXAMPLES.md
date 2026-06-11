# Exemplos de Migração - Antes vs Depois

Este documento mostra exemplos práticos de como o código será refatorado do arquivo monolítico para a arquitetura modular.

---

## 📌 Exemplo 1: Hard Code → Configuração

### ❌ ANTES (futGerminare.html - espalhado)
```javascript
// Linha 50
#splash {
  background: radial-gradient(ellipse at center bottom, #1a2744 0%, var(--bg-dark) 70%);
}

// Linha 200+
const colors = ['#ffd700', '#00e676', '#3b82f6', '#ef4444', '#f97316', '#a855f7'];

// Linha 300+
const MATCH_DURATION = 90;
const PENALTY_ROUNDS = 5;
const DRAFT_TIMEOUT = 15000;

// Linha 500+
const positions = { gk: 'GK', dl: 'ZAG', dr: 'ZAG', al: 'ATA', ar: 'ATA' };

// Linha 800+
if (minute === 45) { /* intervalo */ }
if (minute === 90) { /* fim */ }
```

### ✅ DEPOIS (Modularizado)

**config/constants.js**
```javascript
export const GAME_CONFIG = {
  MATCH_DURATION: 90,
  HALFTIME_MINUTE: 45,
  MATCH_END_MINUTE: 90,
  PENALTY_ROUNDS: 5,
  DRAFT_TIMEOUT: 15000,
  GOAL_CHANCE: 0.15,
  PASS_ACCURACY: 0.8
};

export const FIELD_CONFIG = {
  FORMATION: ['gk', 'dl', 'dr', 'al', 'ar'],
  FORMATION_LABELS: {
    gk: { name: 'GK', team: 'defense' },
    dl: { name: 'ZAG', team: 'defense' },
    dr: { name: 'ZAG', team: 'defense' },
    al: { name: 'ATA', team: 'attack' },
    ar: { name: 'ATA', team: 'attack' }
  },
  POSITIONS: {
    defense: ['gk', 'dl', 'dr'],
    midfield: [],
    attack: ['al', 'ar']
  }
};
```

**config/colors.js**
```javascript
export const COLOR_PALETTE = {
  PRIMARY: '#00e676',
  ACCENT: '#00e676',
  GOLD: '#ffd700',
  SILVER: '#94a3b8',
  RED: '#ef4444',
  BLUE: '#3b82f6',
  CONFETTI: ['#ffd700', '#00e676', '#3b82f6', '#ef4444', '#f97316', '#a855f7'],
  BACKGROUND: {
    DARK: '#0a0e17',
    CARD: '#141b2d',
    CARD_HOVER: '#1c2540'
  }
};
```

**config/messages.js**
```javascript
export const MESSAGES = {
  GAME_TITLE: '7a0 — Espaço da Felicidade',
  SPLASH: {
    SUBTITLE: 'JOGUE AGORA',
    VENUE: '7a0'
  },
  DRAFT: {
    TITLE: 'Escolha seu Time',
    INSTRUCTION: 'Selecione 5 jogadores para seu time'
  },
  MATCH: {
    PLAYING: 'Partida em andamento...',
    HALFTIME: 'INTERVALO',
    FINAL_WHISTLE: 'FIM DE JOGO'
  },
  PENALTIES: {
    TITLE: 'Disputa de Pênaltis',
    INSTRUCTION: 'Selecione quem vai cobrar'
  }
};
```

**config/timing.js**
```javascript
export const TIMING = {
  MATCH_TICK: 500,           // 500ms = 1 minuto de jogo
  GOAL_ANIMATION: 2000,
  EVENT_DELAY: 100,
  PENALTY_KICK: 1500,
  FADE_OUT: 300,
  SCREEN_TRANSITION: 500
};
```

**Uso em main.js:**
```javascript
import { GAME_CONFIG, FIELD_CONFIG } from './config/constants.js';
import { COLOR_PALETTE } from './config/colors.js';
import { MESSAGES } from './config/messages.js';
import { TIMING } from './config/timing.js';

console.log(GAME_CONFIG.MATCH_DURATION);  // 90
console.log(MESSAGES.GAME_TITLE);         // '7a0 — Espaço da Felicidade'
```

---

## 📌 Exemplo 2: Lógica Espalhada → Services

### ❌ ANTES (futGerminare.html - função monolítica)
```javascript
let matchState = {
  minute: 0,
  homeScore: 0,
  awayScore: 0,
  events: []
};

function runMatchTick() {
  matchState.minute++;
  
  // Lógica de gol
  if (Math.random() < 0.15) {
    if (Math.random() > 0.5) {
      matchState.homeScore++;
      document.getElementById('scoreHome').textContent = matchState.homeScore;
      const scorer = homeTeam.players[Math.floor(Math.random() * homeTeam.players.length)];
      addEventToLog(`⚽ ${scorer.name} marcou!`);
      playGoalAnimation();
    } else {
      matchState.awayScore++;
      document.getElementById('scoreAway').textContent = matchState.awayScore;
      // ... mais código repetido
    }
  }
  
  // Intervalo
  if (matchState.minute === 45) {
    document.getElementById('matchStatus').textContent = 'INTERVALO';
    setTimeout(() => {
      document.getElementById('matchStatus').textContent = 'Segundo tempo...';
    }, 3000);
  }
  
  // Fim
  if (matchState.minute === 90) {
    endMatch();
  }
}

function addEventToLog(text) {
  const container = document.getElementById('matchEvents');
  const el = document.createElement('div');
  el.className = 'match-event';
  el.innerHTML = `<span>${text}</span>`;
  container.insertBefore(el, container.firstChild);
}
```

### ✅ DEPOIS (Services - lógica separada)

**js/models/Match.js**
```javascript
export class Match {
  constructor(homeTeam, awayTeam) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.minute = 0;
    this.homeScore = 0;
    this.awayScore = 0;
    this.events = [];
    this.status = 'not_started'; // not_started, first_half, halftime, second_half, finished
  }

  getScore() {
    return {
      home: this.homeScore,
      away: this.awayScore
    };
  }

  getStatus() {
    if (this.minute < 45) return 'first_half';
    if (this.minute === 45) return 'halftime';
    if (this.minute < 90) return 'second_half';
    return 'finished';
  }

  isHalftime() {
    return this.minute === 45;
  }

  isFinished() {
    return this.minute >= 90;
  }

  addEvent(event) {
    this.events.push({
      minute: this.minute,
      ...event,
      timestamp: new Date()
    });
  }
}
```

**js/services/MatchEngine.js**
```javascript
import { GAME_CONFIG } from '../config/constants.js';

export class MatchEngine {
  constructor(match) {
    this.match = match;
    this.goalChance = GAME_CONFIG.GOAL_CHANCE;
  }

  simulateMinute() {
    this.match.minute++;

    // Simular possível gol
    const result = this.checkForGoal();
    if (result.isGoal) {
      this.match[result.team === 'home' ? 'homeScore' : 'awayScore']++;
      this.match.addEvent({
        type: 'goal',
        team: result.team,
        scorer: result.scorer,
        description: `⚽ ${result.scorer.name} marcou!`
      });
      return { type: 'goal', ...result };
    }

    // Verificar intervalo
    if (this.match.minute === 45) {
      this.match.addEvent({
        type: 'halftime',
        description: 'INTERVALO'
      });
      return { type: 'halftime' };
    }

    // Verificar fim
    if (this.match.minute === 90) {
      return { type: 'finished' };
    }

    return { type: 'normal' };
  }

  checkForGoal() {
    if (Math.random() > this.goalChance) {
      return { isGoal: false };
    }

    const team = Math.random() > 0.5 ? 'home' : 'away';
    const teamObj = team === 'home' ? this.match.homeTeam : this.match.awayTeam;
    const scorer = this.getRandomPlayer(teamObj);

    return {
      isGoal: true,
      team,
      scorer
    };
  }

  getRandomPlayer(team) {
    return team.players[Math.floor(Math.random() * team.players.length)];
  }
}
```

**js/ui/screens/MatchScreen.js**
```javascript
import { MatchEngine } from '../../services/MatchEngine.js';

export class MatchScreen {
  constructor(match, eventBus) {
    this.match = match;
    this.engine = new MatchEngine(match);
    this.eventBus = eventBus;
  }

  render() {
    // Atualizar UI com dados do match
    const score = this.match.getScore();
    this.updateScore(score.home, score.away);
    this.updateMinute(this.match.minute);
  }

  handleTick() {
    const result = this.engine.simulateMinute();

    // Emitir eventos para UI
    this.eventBus.emit('minute-updated', { minute: this.match.minute });

    if (result.type === 'goal') {
      this.eventBus.emit('goal-scored', result);
      this.playGoalAnimation();
    } else if (result.type === 'halftime') {
      this.eventBus.emit('halftime', result);
      this.showHalftimeScreen();
    } else if (result.type === 'finished') {
      this.eventBus.emit('match-finished', this.match);
    }

    this.render();
  }

  updateScore(home, away) {
    document.getElementById('scoreHome').textContent = home;
    document.getElementById('scoreAway').textContent = away;
  }

  updateMinute(minute) {
    document.getElementById('matchMinute').textContent = minute;
  }

  playGoalAnimation() {
    // Efeito visual isolado
    const el = document.querySelector('.match-field');
    el.classList.add('goal-flash');
    setTimeout(() => el.classList.remove('goal-flash'), 1000);
  }

  showHalftimeScreen() {
    document.getElementById('matchStatus').textContent = 'INTERVALO';
  }

  addEventToLog(text) {
    const container = document.getElementById('matchEvents');
    const el = document.createElement('div');
    el.className = 'match-event';
    el.innerHTML = `<span>${text}</span>`;
    container.insertBefore(el, container.firstChild);
  }
}
```

**Vantagens:**
- ✅ MatchEngine é **testável** (sem DOM)
- ✅ Lógica pura e reutilizável
- ✅ UI separada da simulação
- ✅ Fácil mudar regras sem quebrar UI

---

## 📌 Exemplo 3: Geração de Jogadores → Database

### ❌ ANTES (futGerminare.html - arrays hard-coded)
```javascript
const allPlayers = [
  { id: 1, name: "Neymar", team: "PSG", ovr: 87, position: "ATA", 
    pace: 92, shooting: 86, passing: 82, dribbling: 90, defense: 38, physical: 78 },
  { id: 2, name: "Vinicius Jr", team: "Real Madrid", ovr: 86, position: "ATA",
    pace: 96, shooting: 85, passing: 80, dribbling: 93, defense: 38, physical: 75 },
  // ... 30+ jogadores hard-coded ...
];

function getRandomTeam() {
  const selected = [];
  const shuffled = allPlayers.sort(() => 0.5 - Math.random()).slice(0, 5);
  return shuffled;
}
```

### ✅ DEPOIS (Database centralizado)

**data/players.json**
```json
{
  "version": "1.0",
  "lastUpdated": "2026-06-11",
  "players": [
    {
      "id": 1,
      "name": "Neymar",
      "team": "PSG",
      "position": "ATA",
      "ovr": 87,
      "stats": {
        "pace": 92,
        "shooting": 86,
        "passing": 82,
        "dribbling": 90,
        "defense": 38,
        "physical": 78
      }
    },
    {
      "id": 2,
      "name": "Vinicius Jr",
      "team": "Real Madrid",
      "position": "ATA",
      "ovr": 86,
      "stats": {
        "pace": 96,
        "shooting": 85,
        "passing": 80,
        "dribbling": 93,
        "defense": 38,
        "physical": 75
      }
    }
  ]
}
```

**js/core/database.js**
```javascript
export class Database {
  constructor() {
    this.players = [];
  }

  async init() {
    const response = await fetch('/data/players.json');
    const data = await response.json();
    this.players = data.players.map(p => new Player(p));
  }

  getAllPlayers() {
    return this.players;
  }

  getPlayerById(id) {
    return this.players.find(p => p.id === id);
  }

  searchPlayers(query) {
    return this.players.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.team.toLowerCase().includes(query.toLowerCase())
    );
  }

  getPlayersByPosition(position) {
    return this.players.filter(p => p.position === position);
  }
}
```

**js/services/PlayerService.js**
```javascript
import { Player } from '../models/Player.js';

export class PlayerService {
  constructor(database) {
    this.database = database;
  }

  getRandomTeam(count = 5) {
    const allPlayers = this.database.getAllPlayers();
    return this.shuffleArray(allPlayers).slice(0, count);
  }

  getBalancedTeam(count = 5) {
    const defenders = this.database.getPlayersByPosition('defense').slice(0, 2);
    const attackers = this.database.getPlayersByPosition('attack').slice(0, 2);
    const goalkeepers = this.database.getPlayersByPosition('goalkeeper').slice(0, 1);
    
    return [...defenders, ...attackers, ...goalkeepers].slice(0, count);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getPlayerStats(player) {
    return player.getStats();
  }
}
```

**Vantagens:**
- ✅ Dados em arquivo separado (fácil de atualizar)
- ✅ Database abstrato (pode ser JSON, API, IndexedDB)
- ✅ Serviço encapsula lógica de busca
- ✅ Fácil adicionar novos métodos

---

## 📌 Exemplo 4: DOM Manipulation → Components

### ❌ ANTES (futGerminare.html - createElement espalhado)
```javascript
function createPlayerCard(player) {
  const card = document.createElement('div');
  card.className = 'player-card';
  card.style.border = (roster.indexOf(player) !== -1) ? '2px solid var(--accent)' : 'transparent';
  
  const name = document.createElement('div');
  name.className = 'player-name';
  name.textContent = player.name;
  
  const ovr = document.createElement('div');
  ovr.className = 'player-ovr';
  ovr.style.color = player.ovr >= 85 ? 'var(--gold)' : 'var(--text)';
  ovr.textContent = player.ovr;
  
  const team = document.createElement('div');
  team.className = 'player-team';
  team.textContent = player.team;
  
  card.appendChild(ovr);
  card.appendChild(name);
  card.appendChild(team);
  
  card.onclick = () => selectPlayer(player);
  
  return card;
}

// Renderizar cards
allPlayers.forEach(player => {
  const card = createPlayerCard(player);
  draftGrid.appendChild(card);
});
```

### ✅ DEPOIS (Component encapsulado)

**js/ui/components/PlayerCard.js**
```javascript
export class PlayerCard {
  constructor(player, options = {}) {
    this.player = player;
    this.isSelected = options.isSelected || false;
    this.onSelect = options.onSelect || (() => {});
  }

  render() {
    const card = document.createElement('div');
    card.className = this.getClassName();
    card.setAttribute('data-player-id', this.player.id);
    
    card.innerHTML = `
      <div class="player-ovr">${this.player.ovr}</div>
      <div class="player-name">${this.player.name}</div>
      <div class="player-team">${this.player.team}</div>
    `;
    
    card.addEventListener('click', () => this.handleClick());
    
    return card;
  }

  getClassName() {
    const base = 'player-card';
    return this.isSelected ? `${base} selected` : base;
  }

  handleClick() {
    this.isSelected = !this.isSelected;
    this.onSelect(this.player, this.isSelected);
  }

  update(options) {
    if (options.isSelected !== undefined) {
      this.isSelected = options.isSelected;
    }
  }

  getElement() {
    return this.render();
  }
}
```

**js/ui/screens/DraftScreen.js**
```javascript
import { PlayerCard } from '../components/PlayerCard.js';

export class DraftScreen {
  constructor(playerService) {
    this.playerService = playerService;
    this.selectedPlayers = [];
    this.playerCards = [];
  }

  render(container) {
    const allPlayers = this.playerService.getRandomTeam(20);
    
    allPlayers.forEach(player => {
      const card = new PlayerCard(player, {
        isSelected: this.selectedPlayers.includes(player.id),
        onSelect: (player, isSelected) => this.handlePlayerSelect(player, isSelected)
      });
      
      this.playerCards.push(card);
      container.appendChild(card.render());
    });
  }

  handlePlayerSelect(player, isSelected) {
    if (isSelected) {
      this.selectedPlayers.push(player.id);
    } else {
      this.selectedPlayers = this.selectedPlayers.filter(id => id !== player.id);
    }
    
    this.updateUI();
  }

  updateUI() {
    document.getElementById('selectedCount').textContent = this.selectedPlayers.length;
  }

  getSelectedPlayers() {
    return this.selectedPlayers;
  }
}
```

**Vantagens:**
- ✅ Component é reutilizável
- ✅ Lógica isolada em classe
- ✅ Fácil testar comportamento
- ✅ Facil reutilizar em outras telas

---

## 📌 Exemplo 5: Screen Navigation → ScreenManager

### ❌ ANTES (futGerminare.html - show/hide)
```javascript
function showScreen(screenName) {
  // Esconder todos
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  
  // Mostrar um
  document.getElementById(screenName).classList.add('active');
  
  // Lógica customizada por tela
  if (screenName === 'draft') {
    initDraft();
  } else if (screenName === 'match') {
    initMatch();
  } else if (screenName === 'penalties') {
    initPenalties();
  }
}
```

### ✅ DEPOIS (ScreenManager centralizado)

**js/ui/screen-manager.js**
```javascript
import { SplashScreen } from './screens/SplashScreen.js';
import { DraftScreen } from './screens/DraftScreen.js';
import { MatchScreen } from './screens/MatchScreen.js';
import { PenaltyScreen } from './screens/PenaltyScreen.js';
import { ResultScreen } from './screens/ResultScreen.js';

export class ScreenManager {
  constructor(services) {
    this.services = services;
    this.currentScreen = null;
    this.screens = {};
    this.initializeScreens();
  }

  initializeScreens() {
    this.screens.splash = new SplashScreen(this);
    this.screens.draft = new DraftScreen(this.services.playerService);
    this.screens.match = new MatchScreen(this.services.matchService);
    this.screens.penalties = new PenaltyScreen(this.services.penaltyService);
    this.screens.result = new ResultScreen(this.services.resultService);
  }

  async showScreen(screenName) {
    // Limpar screen anterior
    if (this.currentScreen) {
      this.currentScreen.cleanup();
    }

    // Esconder todos os screens
    document.querySelectorAll('.screen').forEach(el => {
      el.classList.remove('active');
    });

    // Mostrar novo screen
    const screenEl = document.getElementById(screenName);
    screenEl.classList.add('active');

    // Renderizar novo screen
    this.currentScreen = this.screens[screenName];
    this.currentScreen.mount(screenEl);
  }

  navigate(screenName) {
    this.showScreen(screenName);
  }
}
```

**Vantagens:**
- ✅ Navegação centralizada
- ✅ Cada screen cuida de si mesmo
- ✅ Fácil adicionar nova tela
- ✅ Transições gerenciadas

---

## 📌 Exemplo 6: Estado Global → State Management

### ❌ ANTES (futGerminare.html - variáveis globais espalhadas)
```javascript
let homeTeam = [];
let awayTeam = [];
let currentMinute = 0;
let homeScore = 0;
let awayScore = 0;
let selectedPlayers = [];
let matchState = 'not_started';
let penaltyState = { hScore: 0, aScore: 0, currentStep: 0 };

// Acessado de múltiplos lugares
homeTeam.push(player);
currentMinute++;
homeScore = homeScore + 1;
```

### ✅ DEPOIS (Gerenciador de Estado)

**js/core/state.js**
```javascript
export class State {
  constructor() {
    this.state = {
      game: {
        status: 'not_started', // not_started, draft, match, penalties, finished
        currentScreen: 'splash'
      },
      draft: {
        selectedPlayers: [],
        availablePlayers: [],
        maxSelection: 5
      },
      match: {
        homeTeam: null,
        awayTeam: null,
        minute: 0,
        homeScore: 0,
        awayScore: 0,
        events: []
      },
      penalties: {
        homeScore: 0,
        awayScore: 0,
        currentStep: 0,
        kicks: { home: [], away: [] }
      },
      result: {
        winner: null,
        isDraw: false
      }
    };

    this.listeners = {};
  }

  getState() {
    return { ...this.state };
  }

  getStateSection(section) {
    return { ...this.state[section] };
  }

  setState(section, newState) {
    this.state[section] = { ...this.state[section], ...newState };
    this.notify(section);
  }

  subscribe(section, listener) {
    if (!this.listeners[section]) {
      this.listeners[section] = [];
    }
    this.listeners[section].push(listener);

    // Retorna função para desinscrever
    return () => {
      this.listeners[section] = this.listeners[section].filter(l => l !== listener);
    };
  }

  notify(section) {
    if (this.listeners[section]) {
      this.listeners[section].forEach(listener => {
        listener(this.state[section]);
      });
    }
  }
}
```

**Uso em screens:**
```javascript
import { State } from '../core/state.js';

export class DraftScreen {
  constructor(state) {
    this.state = state;
    
    // Inscrever em mudanças
    this.unsubscribe = this.state.subscribe('draft', (draftState) => {
      this.render(draftState);
    });
  }

  selectPlayer(player) {
    const currentDraft = this.state.getStateSection('draft');
    const updated = {
      selectedPlayers: [...currentDraft.selectedPlayers, player.id]
    };
    this.state.setState('draft', updated);
  }

  cleanup() {
    this.unsubscribe();
  }
}
```

**Vantagens:**
- ✅ Estado centralizado
- ✅ Fácil debugar (um único lugar)
- ✅ Reactive (listeners notificados)
- ✅ Sem variáveis globais

---

## 📌 Resumo da Refatoração

| Aspecto | ANTES | DEPOIS |
|--------|-------|--------|
| **Hard Code** | 30+ valores espalhados | Centralizado em `config/` |
| **Lógica de Jogo** | Misturada com DOM | Pura em `services/` |
| **Dados** | Arrays em funções | `data/players.json` |
| **Componentes UI** | Funções gigantes | Classes reutilizáveis |
| **Estado** | Variáveis globais | Classe `State` |
| **Navegação** | `if/else` | `ScreenManager` |
| **Linhas de Código** | 2000+ em 1 arquivo | 200-300 por arquivo |
| **Testabilidade** | ❌ Impossível | ✅ Fácil |
| **Manutenção** | ❌ Difícil | ✅ Simples |
| **Escalabilidade** | ❌ Limitada | ✅ Alta |

---

## 🎯 Benefícios Práticos

### Antes (Monolítico)
```
Tempo para mudar cor de botão: 15 min (encontrar, modificar, testar)
Tempo para adicionar novo tipo de evento: 30 min
Tempo para debugar score errado: 1 hora
```

### Depois (Modularizado)
```
Tempo para mudar cor de botão: 2 min (em config/colors.js)
Tempo para adicionar novo tipo de evento: 10 min
Tempo para debugar score errado: 10 min (em MatchEngine, lógica pura)
```

---

**Próximo:** Comece pela Fase 1 (CSS) e vá seguindo os exemplos acima!
