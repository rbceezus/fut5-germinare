# Plano de Reestruturação - fut5-germinare

## 📋 Índice
1. [Situação Atual](#situação-atual)
2. [Objetivos](#objetivos)
3. [Estrutura Proposta](#estrutura-proposta)
4. [Separação de Responsabilidades](#separação-de-responsabilidades)
5. [Descentralização de Hard Code](#descentralização-de-hard-code)
6. [Banco de Dados](#banco-de-dados)
7. [Fases de Implementação](#fases-de-implementação)
8. [Guia de Migração](#guia-de-migração)

---

## Situação Atual

### Problemas Identificados
- ❌ **Arquivo Monolítico**: `futGerminare.html` com 2000+ linhas
- ❌ **Mistura de Responsabilidades**: CSS, HTML e JS embutidos no mesmo arquivo
- ❌ **Hard Code Espalhado**: Números, strings, configurações definidas inline
- ❌ **Sem Banco de Dados**: Dados de jogadores definidos em arrays dentro de funções
- ❌ **Difícil Manutenção**: Alterações afetam múltiplos pontos
- ❌ **Impossível Testar**: Código acoplado e interdependente
- ❌ **Sem Reusabilidade**: Componentes não são isolados

---

## Objetivos

✅ **Separação de Concerns** - CSS, HTML, JS, Dados isolados  
✅ **Código Escalável** - Fácil adicionar features sem quebrar existentes  
✅ **Manutenibilidade** - Localizar e alterar código rapidamente  
✅ **Testabilidade** - Módulos testáveis independentemente  
✅ **Reutilização** - Componentes e funções isoladas e genéricas  
✅ **Configurabilidade** - Hard code descentralizado em arquivos de config  
✅ **Data Persistence** - Banco de dados para dados de jogadores e resultados  

---

## Estrutura Proposta

```
fut5-germinare/
│
├── index.html                          # Ponto de entrada único
├── README.md                           # Documentação
├── PLANNING.md                         # Este arquivo
├── .gitignore                          # Ignorar arquivos
│
├── config/                             # 📋 Configurações descentralizadas
│   ├── constants.js                   # Constantes da aplicação
│   ├── colors.js                      # Paleta de cores
│   ├── messages.js                    # Strings de mensagens
│   └── positions.js                   # Posições de campo
│
├── data/                               # 💾 Banco de dados e dados estáticos
│   ├── database.json                  # Base de dados JSON (jogadores, histórico)
│   ├── players.json                   # Lista de jogadores (import do BD)
│   └── defaultPlayers.js              # Gerador de jogadores padrão
│
├── css/                                # 🎨 Estilos separados por responsabilidade
│   ├── variables.css                  # Variáveis CSS globais (:root)
│   ├── base.css                       # Reset, body, tipografia
│   ├── components.css                 # Componentes reutilizáveis
│   ├── screens.css                    # Estilos por tela
│   ├── animations.css                 # Keyframes e transições
│   ├── responsive.css                 # Media queries
│   └── index.css                      # Arquivo que importa todos (se usar)
│
├── js/                                 # 🔧 Lógica modularizada
│   ├── config/                         # Configurações de runtime
│   │   └── config.js                  # Merge de todas as configs
│   │
│   ├── core/                           # Módulos fundamentais
│   │   ├── state.js                   # Gerenciamento de estado global
│   │   ├── storage.js                 # LocalStorage / IndexedDB
│   │   └── database.js                # Interface com dados
│   │
│   ├── models/                         # Modelos de dados
│   │   ├── Player.js                  # Classe de Jogador
│   │   ├── Team.js                    # Classe de Time
│   │   └── Match.js                   # Classe de Partida
│   │
│   ├── services/                       # Lógica de negócio
│   │   ├── PlayerService.js           # Operações com jogadores
│   │   ├── MatchService.js            # Operações de partida
│   │   ├── DraftService.js            # Lógica de draft
│   │   ├── MatchEngine.js             # Simulação da partida
│   │   └── PenaltyService.js          # Lógica de pênaltis
│   │
│   ├── ui/                             # Interface com o usuário
│   │   ├── screens/                   # Controladores de telas
│   │   │   ├── SplashScreen.js        # Tela splash
│   │   │   ├── DraftScreen.js         # Tela de draft
│   │   │   ├── MatchScreen.js         # Tela de partida
│   │   │   ├── PenaltyScreen.js       # Tela de pênaltis
│   │   │   └── ResultScreen.js        # Tela de resultado
│   │   │
│   │   ├── components/                # Componentes de UI
│   │   │   ├── PlayerCard.js          # Card de jogador
│   │   │   ├── RosterDisplay.js       # Exibição do time
│   │   │   ├── MatchField.js          # Campo de jogo
│   │   │   ├── ScoreBoard.js          # Placar
│   │   │   └── EventLog.js            # Log de eventos
│   │   │
│   │   └── screen-manager.js          # Gerencia navegação entre telas
│   │
│   ├── utils/                          # Funções utilitárias
│   │   ├── dom.js                     # Manipulação de DOM
│   │   ├── helpers.js                 # Helpers gerais
│   │   ├── random.js                  # Funções randômicas
│   │   └── effects.js                 # Efeitos visuais (confetti, etc)
│   │
│   └── main.js                         # Ponto de entrada da aplicação
│
├── assets/                             # 📦 Recursos (imagens, ícones, fontes)
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── docs/                               # 📚 Documentação adicional
    ├── API.md                         # API de módulos
    ├── ARCHITECTURE.md                # Arquitetura detalhada
    └── CONTRIBUTING.md                # Guia de contribuição
```

---

## Separação de Responsabilidades

### 1. **Configuração (config/)**
Todos os valores que eram hard-coded agora em arquivos de configuração:

```javascript
// ANTES (hard code espalhado)
const colors = ['#ffd700', '#00e676', '#3b82f6', '#ef4444'];
const messages = {
  splash: "7a0 — Espaço da Felicidade",
  draft: "Escolha seu Time"
};
const positions = { gk: 'GK', dl: 'ZAG', dr: 'ZAG', al: 'ATA', ar: 'ATA' };

// DEPOIS
// config/constants.js
export const GAME_TITLE = "7a0 — Espaço da Felicidade";
export const MATCH_DURATION = 90;
export const DRAFT_TIMEOUT = 15000;

// config/colors.js
export const CONFETTI_COLORS = ['#ffd700', '#00e676', '#3b82f6', '#ef4444'];

// config/messages.js
export const UI_MESSAGES = {
  splash: "7a0 — Espaço da Felicidade",
  draft: "Escolha seu Time"
};

// config/positions.js
export const FIELD_POSITIONS = {
  gk: { label: 'GK', team: 'defense' },
  dl: { label: 'ZAG', team: 'defense' },
  // ...
};
```

### 2. **Dados (data/)**
Base de dados centralizada em JSON:

```json
{
  "players": [
    {
      "id": 1,
      "name": "Neymar",
      "team": "PSG",
      "position": "ATA",
      "ovr": 87,
      "pace": 92,
      "shooting": 86,
      "passing": 82,
      "dribbling": 90,
      "defense": 38,
      "physical": 78
    },
    // ... mais jogadores
  ],
  "gameHistory": [
    {
      "id": 1,
      "date": "2026-06-11",
      "homeScore": 3,
      "awayScore": 2,
      "result": "home"
    }
  ]
}
```

### 3. **Modelo de Dados (js/models/)**
Classes que representam entities:

```javascript
// Player.js
export class Player {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.team = data.team;
    this.position = data.position;
    this.ovr = data.ovr;
    // ... propriedades
  }

  getStats() { /* ... */ }
  isDefender() { /* ... */ }
  canPlayPosition(pos) { /* ... */ }
}

// Team.js
export class Team {
  constructor(name) {
    this.name = name;
    this.players = [];
    this.score = 0;
  }

  addPlayer(player) { /* ... */ }
  removePlayer(player) { /* ... */ }
  getFormation() { /* ... */ }
}
```

### 4. **Lógica de Negócio (js/services/)**
Regras de jogo separadas da UI:

```javascript
// MatchService.js
export class MatchService {
  constructor(homeTeam, awayTeam) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.events = [];
  }

  simulateMinute(minute) {
    // Lógica pura de simulação
    // Sem referências a DOM
    return { goalTeam: null, event: null };
  }

  getScore() {
    return {
      home: this.homeTeam.score,
      away: this.awayTeam.score
    };
  }
}

// PenaltyService.js
export class PenaltyService {
  constructor(homeTeam, awayTeam) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.kicksHome = [];
    this.kicksAway = [];
  }

  simulateKick(team, player) {
    // Lógica de pênalti sem DOM
    const chance = this.calculateSuccessChance(player);
    return Math.random() < chance;
  }
}
```

### 5. **Interface (js/ui/)**
Componentes e telas que se comunicam com services:

```javascript
// screens/MatchScreen.js
export class MatchScreen {
  constructor(matchService) {
    this.matchService = matchService;
    this.currentMinute = 0;
  }

  render() {
    // Renderiza UI baseado no estado
    const score = this.matchService.getScore();
    this.updateScoreBoard(score);
  }

  handleTick() {
    const result = this.matchService.simulateMinute(this.currentMinute);
    this.render();
    if (result.goalTeam) {
      this.playGoalAnimation();
    }
  }
}

// components/PlayerCard.js
export class PlayerCard {
  constructor(player) {
    this.player = player;
  }

  createElement() {
    // Cria elemento DOM do card
    const el = document.createElement('div');
    el.className = 'player-card';
    el.innerHTML = `
      <div class="player-ovr">${this.player.ovr}</div>
      <div class="player-name">${this.player.name}</div>
    `;
    return el;
  }
}
```

### 6. **Utilitários (js/utils/)**
Funções de suporte reutilizáveis:

```javascript
// dom.js - Manipulação de DOM
export function createElement(tag, className, innerHTML = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

export function updateText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

// random.js - Randômicas
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// effects.js - Efeitos visuais
export function launchConfetti(colors) {
  // Efeito isolado e testável
}

export function playSound(soundId) {
  // Som isolado
}
```

---

## Descentralização de Hard Code

### Antes: Hard Code Espalhado
```javascript
// Espalhado em várias funções
if (minute === 45) { /* intervalo */ }
if (minute === 90) { /* fim */ }
const penaltyRounds = 5;
const COLORS = ['#ffd700', '#00e676', '#3b82f6', '#ef4444', '#f97316', '#a855f7'];
const position = ['gk', 'dl', 'dr', 'al', 'ar'];
```

### Depois: Configuração Centralizada
```
config/
├── constants.js       # Números e limites
├── colors.js         # Paleta de cores
├── positions.js      # Configuração de posições
├── messages.js       # Strings de UI
└── timing.js         # Timing e delays
```

**Exemplos:**

```javascript
// config/constants.js
export const GAME_CONFIG = {
  MATCH_DURATION: 90,
  HALFTIME_MINUTE: 45,
  PENALTY_ROUNDS: 5,
  DRAFT_TIMEOUT: 15000,
  FORMATION: ['gk', 'dl', 'dr', 'al', 'ar'],
  FORMATION_LABELS: {
    gk: 'GK',
    dl: 'ZAG',
    dr: 'ZAG',
    al: 'ATA',
    ar: 'ATA'
  }
};

// config/timing.js
export const TIMING = {
  MATCH_TICK: 500,        // 500ms = 1 minuto
  GOAL_ANIMATION: 2000,
  PENALTY_KICK: 1500,
  FADE_OUT: 300
};

// config/colors.js
export const COLORS = {
  CONFETTI: ['#ffd700', '#00e676', '#3b82f6', '#ef4444', '#f97316', '#a855f7'],
  PRIMARY: '#00e676',
  DANGER: '#ef4444'
};
```

---

## Banco de Dados Externo

### 1. **API de Acesso a Banco Externo**
Cliente para comunicação com API REST:

```javascript
// js/core/database-client.js
export class DatabaseClient {
  constructor(apiBaseUrl = process.env.API_BASE_URL) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  async authenticate(credentials) {
    const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    this.token = data.token;
    localStorage.setItem('auth_token', this.token);
    return data;
  }

  async getPlayers(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(
      `${this.apiBaseUrl}/players?${query}`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch players');
    return response.json();
  }

  async saveMatch(matchData) {
    const response = await fetch(`${this.apiBaseUrl}/matches`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(matchData)
    });
    if (!response.ok) throw new Error('Failed to save match');
    return response.json();
  }

  async getMatchHistory(userId) {
    const response = await fetch(
      `${this.apiBaseUrl}/users/${userId}/matches`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  }

  async getMatchById(id) {
    const response = await fetch(
      `${this.apiBaseUrl}/matches/${id}`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Match not found');
    return response.json();
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }
}
```

### 2. **Repository Pattern - Camada de Acesso a Dados**
Abstração de dados para fácil manutenção:

```javascript
// js/core/repositories/PlayerRepository.js
export class PlayerRepository {
  constructor(databaseClient) {
    this.db = databaseClient;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
  }

  async getAllPlayers(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('all_players')) {
      return this.cache.get('all_players').data;
    }

    const players = await this.db.getPlayers();
    this.setCacheEntry('all_players', players);
    return players;
  }

  async searchPlayers(query) {
    return this.db.getPlayers({ search: query });
  }

  async getPlayersByPosition(position) {
    return this.db.getPlayers({ position });
  }

  async invalidateCache() {
    this.cache.clear();
  }

  isCacheValid(key) {
    if (!this.cache.has(key)) return false;
    const entry = this.cache.get(key);
    return Date.now() - entry.timestamp < this.cacheExpiry;
  }

  setCacheEntry(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

// js/core/repositories/MatchRepository.js
export class MatchRepository {
  constructor(databaseClient, userId) {
    this.db = databaseClient;
    this.userId = userId;
  }

  async saveMatch(match) {
    const matchData = {
      ...match,
      userId: this.userId,
      createdAt: new Date().toISOString()
    };
    return this.db.saveMatch(matchData);
  }

  async getMatchHistory() {
    return this.db.getMatchHistory(this.userId);
  }

  async getMatchById(id) {
    return this.db.getMatchById(id);
  }

  async getRecentMatches(limit = 10) {
    const history = await this.getMatchHistory();
    return history
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  async getStatistics() {
    const history = await this.getMatchHistory();
    return {
      totalMatches: history.length,
      wins: history.filter(m => m.result === 'home').length,
      losses: history.filter(m => m.result === 'away').length,
      draws: history.filter(m => m.result === 'draw').length
    };
  }
}
```

### 3. **Modelo de Dados - Schemas**
Estrutura de documentos no banco externo:

```javascript
// Documento de Match
{
  id: 1,
  date: "2026-06-11T09:30:00Z",
  homeTeam: {
    name: "Seu Time",
    players: [1, 5, 10, 15, 20],
    score: 3
  },
  awayTeam: {
    name: "Time Adversário",
    players: [2, 6, 11, 16, 21],
    score: 2
  },
  result: "home", // 'home' | 'away' | 'draw'
  duration: 90,
  events: [
    { minute: 15, type: 'goal', team: 'home', playerId: 1 },
    { minute: 45, type: 'halftime', team: null, playerId: null }
  ],
  penalties: {
    home: { score: 5, kicks: [true, true, false, true, true] },
    away: { score: 4, kicks: [true, true, true, false, true] }
  }
}
```

---

## Fases de Implementação

### **Fase 1: Estrutura Base (CSS)**
Separar estilos em arquivos temáticos:

```bash
✓ config/
  - constants.js         # Valores constantes
  - colors.js           # Paleta de cores
  - messages.js         # Strings
  - positions.js        # Configuração de posições

✓ css/
  - variables.css       # Variáveis CSS
  - base.css           # Reset e tipografia
  - components.css     # Botões, cards, campos
  - screens.css        # Splash, draft, match, etc
  - animations.css     # Keyframes
  - responsive.css     # Media queries

✓ index.html          # Importar todos os CSS
```

### **Fase 2: Modelos de Dados**
Criar classes e estruturas:

```bash
✓ data/
  - players.json        # Base de jogadores
  - defaultPlayers.js  # Gerador de dados

✓ js/models/
  - Player.js          # Classe Player
  - Team.js            # Classe Team
  - Match.js           # Classe Match
```

### **Fase 3: Core Services**
Lógica de negócio sem UI:

```bash
✓ js/core/
  - state.js            # Estado global
  - storage.js          # Persistência
  - database.js         # Interface com dados

✓ js/services/
  - PlayerService.js    # Operações com jogadores
  - MatchService.js     # Simulação de jogo
  - DraftService.js     # Lógica de draft
  - PenaltyService.js   # Lógica de pênaltis
```

### **Fase 4: UI Components**
Componentes e telas:

```bash
✓ js/ui/components/
  - PlayerCard.js       # Card de jogador
  - RosterDisplay.js    # Exibição do time
  - ScoreBoard.js       # Placar
  - EventLog.js         # Log de eventos

✓ js/ui/screens/
  - SplashScreen.js     # Tela inicial
  - DraftScreen.js      # Draft
  - MatchScreen.js      # Partida
  - PenaltyScreen.js    # Pênaltis
  - ResultScreen.js     # Resultado

✓ js/ui/
  - screen-manager.js   # Navegação
```

### **Fase 5: Utilitários e Main**
Funções de suporte e ponto de entrada:

```bash
✓ js/utils/
  - dom.js              # Manipulação de DOM
  - helpers.js          # Funções gerais
  - random.js           # Randômicas
  - effects.js          # Efeitos visuais

✓ js/
  - main.js             # Inicializa a app
```

### **Fase 6: Testes e Otimizações**
Validação completa:

```bash
✓ Testes de todas as telas
✓ Verificação de responsividade
✓ Validação de dados
✓ Performance
```

---

## Guia de Migração

### Passo 1: Extrair CSS
```bash
1. Criar pasta css/
2. Identificar blocos CSS no futGerminare.html
3. Separar por arquivo temático
4. Criar index.html que importa todos
```

### Passo 2: Organizar HTML
```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <!-- CSS -->
  <link rel="stylesheet" href="css/variables.css">
  <link rel="stylesheet" href="css/base.css">
  <!-- ... outros CSS ... -->
</head>
<body>
  <!-- Todos os screens -->
  <div id="splash" class="screen active"><!-- ... --></div>
  <div id="draft" class="screen"><!-- ... --></div>
  <!-- ... -->

  <!-- Scripts em ordem -->
  <script src="config/constants.js" type="module"></script>
  <script src="js/main.js" type="module"></script>
</body>
</html>
```

### Passo 3: Criar Módulos Base
```javascript
// js/config/config.js
import * as constants from './constants.js';
import * as colors from './colors.js';
import * as messages from './messages.js';

export const CONFIG = { constants, colors, messages };
```

### Passo 4: Implementar Services
```javascript
// js/services/PlayerService.js
export class PlayerService {
  constructor(database) {
    this.db = database;
  }

  async getAllPlayers() {
    return this.db.getPlayers();
  }

  // ... métodos
}
```

### Passo 5: Criar UI Components
```javascript
// js/ui/components/PlayerCard.js
export class PlayerCard {
  constructor(player) {
    this.player = player;
  }

  render() {
    // Retorna elemento DOM
  }
}
```

### Passo 6: Integrar Tudo em main.js
```javascript
// js/main.js
import { CONFIG } from './config/config.js';
import { Database } from './core/database.js';
import { ScreenManager } from './ui/screen-manager.js';

async function init() {
  const db = new Database();
  await db.init();
  
  const screenManager = new ScreenManager(db);
  screenManager.showScreen('splash');
}

init();
```

---

## Benefícios da Nova Arquitetura

| Aspecto | Antes | Depois |
|--------|-------|--------|
| **Manutenção** | Difícil (2000 linhas) | Fácil (cada arquivo 100-300 linhas) |
| **Testabilidade** | Impossível | Possível (módulos isolados) |
| **Reutilização** | Nenhuma | Componentes genéricos |
| **Escalabilidade** | Limitada | Alta (adicionar features é simples) |
| **Colaboração** | Conflitos | Múltiplos arquivos em paralelo |
| **Performance** | OK | Melhor (lazy loading no futuro) |
| **Debugagem** | Stack traces confusos | Rastreamento claro |
| **Hard Code** | 30+ valores espalhados | 0 (centralizado em config/) |

---

## Próximas Etapas

1. ✅ **Aprovação do Plano** (CONCLUÍDO)
2. ⏳ **Implementação Paralela** (PRÓXIMO)
   - Fase 1: CSS
   - Fase 2: Dados
   - Fase 3: Services
   - Fase 4: UI
   - Fase 5: Integração
3. 🧪 **Testes Completos**
4. 📚 **Documentação**

---

## Comandos Úteis

```bash
# Verificar estrutura
tree -L 3

# Validar módulos
node --check js/main.js

# Servir localmente
python -m http.server 8000

# Build (futuro)
npm run build
```

---

**Status**: Planejamento Concluído ✅  
**Próximo**: Aguardando confirmação para iniciar implementação
