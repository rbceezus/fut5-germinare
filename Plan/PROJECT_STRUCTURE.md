# Estrutura Completa do Projeto fut5-germinare

## 🎯 Visão Geral

```
fut5-germinare/
├── 📄 index.html                    ← Ponto de entrada único
├── 📄 README.md                     ← Documentação principal
├── 📄 PLANNING.md                   ← Plano de implementação (este arquivo)
├── 📄 PROJECT_STRUCTURE.md          ← Este arquivo
├── 📄 .gitignore
│
├── 📂 config/                       ← Configurações descentralizadas
│   ├── constants.js                 ← Valores constantes do jogo
│   ├── colors.js                    ← Paleta de cores
│   ├── messages.js                  ← Strings e mensagens de UI
│   ├── positions.js                 ← Configuração de posições de campo
│   ├── timing.js                    ← Timing e delays
│   └── config.js                    ← Merge de todas as configs
│
├── 📂 data/                         ← Acesso a banco de dados externo
│   ├── api-config.js                ← Configuração de conexão com API
│   └── .env.example                 ← Variáveis de ambiente (exemplo)
│
├── 📂 css/                          ← Estilos (separação por responsabilidade)
│   ├── variables.css                ← Variáveis CSS globais (:root)
│   ├── base.css                     ← Reset, body, tipografia
│   ├── components.css               ← Componentes (btn, card, roster)
│   ├── screens.css                  ← Estilos de telas (splash, draft, match, etc)
│   ├── animations.css               ← Keyframes e transições
│   ├── responsive.css               ← Media queries e responsividade
│   └── index.css                    ← (opcional) Importa todos os CSS
│
├── 📂 js/                           ← Lógica modularizada
│
│   ├── 📂 config/
│   │   └── config.js                ← Exporta todas as configurações
│   │
│   ├── 📂 core/                     ← Módulos fundamentais
│   │   ├── state.js                 ← Gerenciamento de estado global
│   │   ├── database-client.js       ← Cliente para API externa
│   │   ├── event-bus.js             ← Sistema de eventos
│   │   └── 📂 repositories/         ← Padrão Repository
│   │       ├── PlayerRepository.js  ← Acesso a dados de jogadores
│   │       └── MatchRepository.js   ← Acesso a histórico de partidas
│   │
│   ├── 📂 models/                   ← Modelos de dados (classes)
│   │   ├── Player.js                ← Classe Player
│   │   ├── Team.js                  ← Classe Team
│   │   ├── Match.js                 ← Classe Match
│   │   ├── Event.js                 ← Classe de Evento
│   │   └── Penalty.js               ← Classe de Pênalti
│   │
│   ├── 📂 services/                 ← Lógica de negócio (sem UI)
│   │   ├── PlayerService.js         ← CRUD de jogadores
│   │   ├── TeamService.js           ← Gerenciamento de times
│   │   ├── MatchService.js          ← Simulação de partida
│   │   ├── MatchEngine.js           ← Engine de simulação (90 minutos)
│   │   ├── DraftService.js          ← Lógica de draft
│   │   ├── PenaltyService.js        ← Lógica de pênaltis
│   │   └── ResultService.js         ← Cálculo de resultados
│   │
│   ├── 📂 ui/                       ← Interface com usuário
│   │
│   │   ├── 📂 screens/              ← Controladores de telas
│   │   │   ├── SplashScreen.js      ← Tela inicial / menu
│   │   │   ├── DraftScreen.js       ← Seleção de jogadores
│   │   │   ├── MatchScreen.js       ← Simulação da partida
│   │   │   ├── PenaltyScreen.js     ← Disputa de pênaltis
│   │   │   └── ResultScreen.js      ← Tela de resultado final
│   │
│   │   ├── 📂 components/           ← Componentes reutilizáveis
│   │   │   ├── PlayerCard.js        ← Card individual de jogador
│   │   │   ├── RosterDisplay.js     ← Exibição do time completo
│   │   │   ├── MatchField.js        ← Visualização do campo
│   │   │   ├── ScoreBoard.js        ← Placar e informações
│   │   │   ├── EventLog.js          ← Log de eventos da partida
│   │   │   ├── Button.js            ← Componente de botão genérico
│   │   │   └── Modal.js             ← Componente de modal
│   │
│   │   └── screen-manager.js        ← Gerenciador de navegação
│   │
│   ├── 📂 utils/                    ← Funções utilitárias
│   │   ├── dom.js                   ← Manipulação de DOM helpers
│   │   ├── helpers.js               ← Funções gerais e reutilizáveis
│   │   ├── random.js                ← Geradores de números aleatórios
│   │   ├── effects.js               ← Efeitos visuais (confetti, sons)
│   │   ├── validators.js            ← Validações
│   │   ├── formatters.js            ← Formatadores (tempo, scores)
│   │   └── logger.js                ← Sistema de logging (debug)
│   │
│   └── main.js                      ← Ponto de entrada da aplicação
│
├── 📂 assets/                       ← Recursos (imagens, ícones, fontes)
│   ├── 📂 images/
│   │   └── logo.png
│   ├── 📂 icons/
│   │   └── favicon.ico
│   └── 📂 fonts/
│       └── (fonte customizada se houver)
│
└── 📂 docs/                         ← Documentação adicional
    ├── API.md                       ← API pública de módulos
    ├── ARCHITECTURE.md              ← Arquitetura detalhada
    ├── CONTRIBUTING.md              ← Guia de contribuição
    ├── TESTING.md                   ← Guia de testes
    └── MIGRATION.md                 ← Guia de migração do código antigo
```

---

## 📋 Legenda

| Símbolo | Significado |
|---------|------------|
| 📄 | Arquivo |
| 📂 | Diretório |
| ← | Descrição |

---

## 🔄 Fluxo de Dados

```
┌─────────────────┐
│  index.html     │
│  (UI Structure) │
└────────┬────────┘
         │
    ┌────┴─────┐
    │           │
┌───▼───┐  ┌───▼───┐
│  CSS  │  │   JS  │
└───────┘  └───┬───┘
           ┌───┴───────────────────────┐
           │                           │
      ┌────▼────┐         ┌────────────▼──────┐
      │ config/ │         │  Data & Services  │
      │         │         │                   │
      │ ├─ constants.js   │ ┌────────────────┐│
      │ ├─ colors.js      │ │ data/           ││
      │ ├─ messages.js    │ │ ├─ players.json││
      │ ├─ positions.js   │ │ ├─ database.js ││
      │ └─ timing.js      │ │ └─ storage.js  ││
      │                   │ │                 ││
      │                   │ │ services/       ││
      │                   │ │ ├─ PlayerService││
      │                   │ │ ├─ MatchService││
      │                   │ │ ├─ DraftService││
      │                   │ │ └─ Penalties..  ││
      └────────────────────┼─┴─────────────────┘
                           │
                     ┌─────▼──────────┐
                     │   UI/screens/  │
                     │ & components/  │
                     │                │
                     │ ├─ SplashScreen│
                     │ ├─ DraftScreen │
                     │ ├─ MatchScreen │
                     │ ├─ components/ │
                     │ └─ EventLog    │
                     └────────────────┘
```

---

## 🎯 O Que Cada Módulo Faz

### **config/** - Configurações
Centraliza todos os valores que não deveriam estar hard-coded:
- ✅ Constantes do jogo (duração, timeout, etc)
- ✅ Paleta de cores
- ✅ Mensagens de UI
- ✅ Posições de campo
- ✅ Timing e delays

**Uso:**
```javascript
import { GAME_CONFIG, COLORS, MESSAGES } from './config/config.js';

console.log(GAME_CONFIG.MATCH_DURATION);  // 90
console.log(COLORS.PRIMARY);               // #00e676
```

---

### **data/** - Configuração de Banco Externo
Acesso a banco de dados centralizado via API:
- ✅ `api-config.js` - Configuração de conexão
- ✅ `.env.example` - Variáveis de ambiente

**Uso:**
```javascript
import { DatabaseClient } from './core/database-client.js';
import { PlayerRepository } from './core/repositories/PlayerRepository.js';

const dbClient = new DatabaseClient(process.env.API_BASE_URL);
const playerRepo = new PlayerRepository(dbClient);

const allPlayers = await playerRepo.getAllPlayers();
const player = await playerRepo.searchPlayers('Neymar');
```

---

### **css/** - Estilos
Separação de responsabilidades em CSS:
- ✅ `variables.css` - CSS custom properties (cores, fonts, etc)
- ✅ `base.css` - Reset, body, tipografia
- ✅ `components.css` - Botões, cards, inputs
- ✅ `screens.css` - Layout das telas
- ✅ `animations.css` - Keyframes e transições
- ✅ `responsive.css` - Media queries

**Benefício:** Fácil encontrar e modificar estilos específicos

---

### **js/core/** - Fundações
Módulos fundamentais que todos usam:
- ✅ `state.js` - Estado global da app
- ✅ `database-client.js` - Cliente para API externa
- ✅ `repositories/PlayerRepository.js` - Acesso a jogadores
- ✅ `repositories/MatchRepository.js` - Acesso a partidas
- ✅ `event-bus.js` - Comunicação entre módulos

**Uso:**
```javascript
import { State } from './core/state.js';
import { DatabaseClient } from './core/database-client.js';
import { PlayerRepository } from './core/repositories/PlayerRepository.js';
import { EventBus } from './core/event-bus.js';

const state = new State();
const dbClient = new DatabaseClient(process.env.API_BASE_URL);
const playerRepo = new PlayerRepository(dbClient);
const bus = new EventBus();

bus.on('goal-scored', (data) => {
  console.log(`Gol de ${data.player.name}!`);
});
```

---

### **js/models/** - Modelos de Dados
Classes que representam entidades do jogo:
- ✅ `Player.js` - Representa um jogador
- ✅ `Team.js` - Representa um time
- ✅ `Match.js` - Representa uma partida

**Uso:**
```javascript
import { Player } from './models/Player.js';

const player = new Player({
  id: 1,
  name: 'Neymar',
  ovr: 87,
  // ...
});

console.log(player.getName());
console.log(player.getOverall());
```

---

### **js/services/** - Lógica de Negócio
Regras do jogo sem referências a UI:
- ✅ `PlayerService.js` - Operações com jogadores
- ✅ `MatchService.js` - Controla simulação da partida
- ✅ `DraftService.js` - Lógica de draft
- ✅ `PenaltyService.js` - Lógica de pênaltis

**Importante:** Services são **100% testáveis** porque não tocam em DOM

**Uso:**
```javascript
import { MatchService } from './services/MatchService.js';

const match = new MatchService(homeTeam, awayTeam);
const result = match.simulateMinute(15);

if (result.goal) {
  console.log(`Gol de ${result.goalScorer.name}!`);
}
```

---

### **js/ui/screens/** - Telas
Controladores de cada tela (navegação):
- ✅ `SplashScreen.js` - Menu inicial
- ✅ `DraftScreen.js` - Seleção de jogadores
- ✅ `MatchScreen.js` - Simulação da partida
- ✅ `PenaltyScreen.js` - Disputa de pênaltis
- ✅ `ResultScreen.js` - Resultado final

**Responsabilidade:** Gerenciar estado da tela e comunicar com services

**Uso:**
```javascript
import { ScreenManager } from './ui/screen-manager.js';

const screenManager = new ScreenManager();
screenManager.showScreen('draft');
```

---

### **js/ui/components/** - Componentes
Componentes reutilizáveis de UI:
- ✅ `PlayerCard.js` - Card de um jogador
- ✅ `RosterDisplay.js` - Lista de jogadores do time
- ✅ `MatchField.js` - Campo com 5 posições
- ✅ `ScoreBoard.js` - Placar atual

**Importante:** Components são **genéricos e reutilizáveis**

**Uso:**
```javascript
import { PlayerCard } from './ui/components/PlayerCard.js';

const card = new PlayerCard(player);
const element = card.render();
document.body.appendChild(element);
```

---

### **js/utils/** - Utilitários
Funções de suporte reutilizáveis:
- ✅ `dom.js` - Helpers de DOM (create, update, remove)
- ✅ `helpers.js` - Funções gerais
- ✅ `random.js` - Randômicas
- ✅ `effects.js` - Efeitos visuais (confetti, sons)
- ✅ `formatters.js` - Formatação (tempo, números)

**Uso:**
```javascript
import { createElement, updateText } from './utils/dom.js';
import { randomInt, randomElement } from './utils/random.js';
import { launchConfetti } from './utils/effects.js';

const el = createElement('div', 'player-card', '<p>Neymar</p>');
const random = randomInt(1, 100);
launchConfetti();
```

---

## 📊 Matriz de Responsabilidades

| Aspecto | Arquivo | Responsável Por |
|--------|---------|-----------------|
| Hard Code | `config/*` | Centralizar valores |
| Dados Estáticos | `data/players.json` | Base de jogadores |
| Dados Dinâmicos | `core/storage.js` | LocalStorage / IndexedDB |
| Regras de Jogo | `services/*` | Lógica pura (sem DOM) |
| Renderização | `ui/screens/*` | Coordenar tela |
| Componentes | `ui/components/*` | UI genérica e reutilizável |
| Helpers | `utils/*` | Funções suporte |
| CSS | `css/*` | Estilos organizados |

---

## 🔗 Dependências Entre Módulos

```
main.js
├── config/
├── core/state.js
├── core/storage.js
├── core/database.js
└── ui/screen-manager.js
    ├── ui/screens/*
    │   ├── services/*
    │   │   ├── models/*
    │   │   └── core/database.js
    │   └── ui/components/*
    │       └── utils/*
    └── utils/dom.js
```

---

## 🚀 Como Começar

### 1. Criar Estrutura de Pastas
```bash
mkdir -p config data css js/{config,core,models,services,ui/{screens,components},utils} assets/{images,icons,fonts} docs
```

### 2. Mover CSS
```bash
# Extrair CSS do futGerminare.html para arquivos em css/
# Começar por: variables.css, base.css, components.css
```

### 3. Criar Módulos
```bash
# Começar pelo core: config.js, database.js, state.js
# Depois models: Player.js, Team.js, Match.js
# Depois services: PlayerService.js, MatchService.js
```

### 4. Criar Screens
```bash
# Converter cada tela em um módulo
# screens/SplashScreen.js, DraftScreen.js, MatchScreen.js
```

### 5. Testes
```bash
# Testar cada screen manualmente
# Verificar console para erros
# Testar responsividade
```

---

## ✅ Checklist de Implementação

- [ ] Estrutura de pastas criada
- [ ] CSS separado em arquivos temáticos
- [ ] `config/` com todas as configurações
- [ ] `data/players.json` com base de jogadores
- [ ] `core/state.js` para gerenciamento de estado
- [ ] `core/database.js` para acesso aos dados
- [ ] `models/Player.js`, `Team.js`, `Match.js`
- [ ] `services/` com lógica de negócio
- [ ] `ui/screens/` com todas as telas
- [ ] `ui/components/` com componentes reutilizáveis
- [ ] `utils/` com funções de suporte
- [ ] `main.js` integrando tudo
- [ ] `index.html` importando CSS e JS
- [ ] Testes de todas as funcionalidades
- [ ] Documentação atualizada

---

## 📚 Documentação Relacionada

- `PLANNING.md` - Plano detalhado de reestruturação
- `docs/API.md` - API pública de módulos
- `docs/ARCHITECTURE.md` - Arquitetura detalhada
- `docs/CONTRIBUTING.md` - Guia de contribuição

---

**Status:** Estrutura Planejada ✅  
**Próximo:** Implementação começando pela Fase 1 (CSS)
