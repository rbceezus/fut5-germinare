# 🏗️ Arquitetura de Banco de Dados - fut5-germinare

## 📋 Visão Geral

O projeto utiliza um **banco de dados externo** acessado via **API REST**, em vez de dados estáticos em JSON ou localStorage.

```
Cliente (Frontend) ←→ API REST ←→ Banco de Dados Externo
   (index.html)      (Node.js)     (PostgreSQL/MongoDB)
```

---

## 🎯 Benefícios

✅ **Dados Centralizados** - Uma única fonte de verdade  
✅ **Multi-usuario** - Suporta múltiplos usuários simultaneamente  
✅ **Escalável** - Crescimento sem limite de dados  
✅ **Seguro** - Autenticação e autorização no servidor  
✅ **Sincronização** - Dados consistentes em todas as plataformas  
✅ **Histórico** - Auditoria completa de ações  

---

## 📁 Estrutura de Arquivos

```
data/
├── api-config.js        # Configuração de conexão com API
└── .env.example         # Template de variáveis de ambiente

js/core/
├── database-client.js   # Cliente HTTP para API
└── repositories/
    ├── PlayerRepository.js    # Acesso a jogadores
    └── MatchRepository.js     # Acesso a partidas
```

---

## 🔌 Configuração de Conexão

### **data/api-config.js**
```javascript
// Configuração centralizada de API
export const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'https://api.fut5germinare.com',
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
  endpoints: {
    auth: '/auth',
    players: '/players',
    matches: '/matches',
    users: '/users'
  }
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id'
};
```

### **.env.example**
```bash
# API Configuration
API_BASE_URL=https://api.fut5germinare.com
API_TIMEOUT=5000

# Authentication
AUTH_ENABLED=true

# Environment
NODE_ENV=production
DEBUG=false
```

---

## 🔑 Cliente de Banco de Dados

### **js/core/database-client.js**

```javascript
import { API_CONFIG, STORAGE_KEYS } from '../../data/api-config.js';

export class DatabaseClient {
  constructor(baseUrl = API_CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
    this.token = this.getStoredToken();
    this.refreshToken = this.getStoredRefreshToken();
    this.userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  }

  /**
   * Autenticação
   */
  async authenticate(email, password) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      this.token = response.token;
      this.refreshToken = response.refreshToken;
      this.userId = response.userId;

      this.storeCredentials();
      return response;
    } catch (error) {
      throw new Error('Falha na autenticação: ' + error.message);
    }
  }

  async logout() {
    this.token = null;
    this.refreshToken = null;
    this.userId = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
  }

  /**
   * Jogadores
   */
  async getPlayers(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/players?${query}`);
  }

  async getPlayerById(id) {
    return this.request(`/players/${id}`);
  }

  async searchPlayers(query) {
    return this.request('/players/search', {
      method: 'POST',
      body: { query }
    });
  }

  /**
   * Partidas
   */
  async saveMatch(matchData) {
    return this.request('/matches', {
      method: 'POST',
      body: matchData
    });
  }

  async getMatchHistory(userId = this.userId) {
    return this.request(`/users/${userId}/matches`);
  }

  async getMatchById(id) {
    return this.request(`/matches/${id}`);
  }

  async updateMatch(id, updateData) {
    return this.request(`/matches/${id}`, {
      method: 'PUT',
      body: updateData
    });
  }

  /**
   * Utilitários
   */
  private async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        timeout: API_CONFIG.timeout
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.request(endpoint, options);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      const data = await response.json();
      this.token = data.token;
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.token);
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : '',
      'User-Agent': 'Fut5Germinare/1.0'
    };
  }

  private storeCredentials() {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, this.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER_ID, this.userId);
  }

  private getStoredToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null;
  }

  private getStoredRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || null;
  }

  isAuthenticated() {
    return !!this.token;
  }
}
```

---

## 📦 Repository Pattern

### **js/core/repositories/PlayerRepository.js**

```javascript
export class PlayerRepository {
  constructor(databaseClient) {
    this.db = databaseClient;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Obtém todos os jogadores com cache
   */
  async getAllPlayers(forceRefresh = false) {
    const cacheKey = 'all_players';

    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    const players = await this.db.getPlayers();
    this.setCacheEntry(cacheKey, players);
    return players;
  }

  /**
   * Busca jogadores por query
   */
  async searchPlayers(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.db.searchPlayers(query);
  }

  /**
   * Filtra por posição
   */
  async getPlayersByPosition(position) {
    const players = await this.getAllPlayers();
    return players.filter(p => p.position === position);
  }

  /**
   * Obtém um jogador específico
   */
  async getPlayerById(id) {
    return this.db.getPlayerById(id);
  }

  /**
   * Invalida cache
   */
  invalidateCache() {
    this.cache.clear();
  }

  /**
   * Privados
   */
  private isCacheValid(key) {
    if (!this.cache.has(key)) return false;
    const entry = this.cache.get(key);
    return Date.now() - entry.timestamp < this.cacheExpiry;
  }

  private setCacheEntry(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

### **js/core/repositories/MatchRepository.js**

```javascript
export class MatchRepository {
  constructor(databaseClient, userId) {
    this.db = databaseClient;
    this.userId = userId;
  }

  /**
   * Salva uma partida
   */
  async saveMatch(match) {
    const matchData = {
      ...match,
      userId: this.userId,
      createdAt: new Date().toISOString()
    };
    return this.db.saveMatch(matchData);
  }

  /**
   * Obtém histórico de partidas do usuário
   */
  async getMatchHistory() {
    return this.db.getMatchHistory(this.userId);
  }

  /**
   * Obtém uma partida específica
   */
  async getMatchById(id) {
    return this.db.getMatchById(id);
  }

  /**
   * Atualiza uma partida
   */
  async updateMatch(id, updateData) {
    return this.db.updateMatch(id, updateData);
  }

  /**
   * Obtém partidas recentes
   */
  async getRecentMatches(limit = 10) {
    const history = await this.getMatchHistory();
    return history
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Calcula estatísticas
   */
  async getStatistics() {
    const history = await this.getMatchHistory();
    return {
      totalMatches: history.length,
      wins: history.filter(m => m.result === 'home').length,
      losses: history.filter(m => m.result === 'away').length,
      draws: history.filter(m => m.result === 'draw').length,
      winRate: (history.filter(m => m.result === 'home').length / history.length) * 100
    };
  }
}
```

---

## 🗄️ Schemas do Banco de Dados

### **Usuário**
```javascript
{
  id: "uuid",
  email: "user@example.com",
  password: "hashed_password",
  name: "John Doe",
  createdAt: "2026-06-11T09:00:00Z",
  updatedAt: "2026-06-11T09:00:00Z"
}
```

### **Jogador**
```javascript
{
  id: 1,
  name: "Neymar",
  team: "PSG",
  position: "ATA", // ATA, DEF, GK
  ovr: 87,
  stats: {
    pace: 92,
    shooting: 86,
    passing: 82,
    dribbling: 90,
    defense: 38,
    physical: 78
  },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-06-11T09:00:00Z"
}
```

### **Partida**
```javascript
{
  id: "uuid",
  userId: "uuid",
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
  },
  createdAt: "2026-06-11T10:00:00Z",
  updatedAt: "2026-06-11T11:30:00Z"
}
```

---

## 🔄 Fluxo de Dados

```
UI Component
    ↓
DraftScreen / MatchScreen
    ↓
PlayerRepository / MatchRepository
    ↓
DatabaseClient
    ↓
Fetch API
    ↓
API Server
    ↓
Banco de Dados
```

### Exemplo: Buscar Jogadores

```javascript
import { PlayerRepository } from './core/repositories/PlayerRepository.js';
import { DatabaseClient } from './core/database-client.js';

// Inicializar
const dbClient = new DatabaseClient();
const playerRepo = new PlayerRepository(dbClient);

// Usar
const players = await playerRepo.getAllPlayers(); // Primeiro acesso = API
const players2 = await playerRepo.getAllPlayers(); // Segundo acesso = Cache

// Invalidar cache se precisar atualizar
playerRepo.invalidateCache();
const players3 = await playerRepo.getAllPlayers(); // API novamente
```

---

## 🔐 Autenticação

### Fluxo de Login

```javascript
import { DatabaseClient } from './core/database-client.js';

const dbClient = new DatabaseClient();

try {
  const result = await dbClient.authenticate('user@example.com', 'password');
  console.log('Login successful:', result);
  // Token armazenado automaticamente no localStorage
} catch (error) {
  console.error('Login failed:', error);
}
```

### Fluxo de Token Refresh

```
Request com Token Expirado
    ↓
API retorna 401
    ↓
DatabaseClient detecta e faz refresh
    ↓
Obtém novo token
    ↓
Retry da requisição original
```

---

## 🚀 Inicialização no main.js

```javascript
import { DatabaseClient } from './core/database-client.js';
import { PlayerRepository } from './core/repositories/PlayerRepository.js';
import { MatchRepository } from './core/repositories/MatchRepository.js';
import { ScreenManager } from './ui/screen-manager.js';

async function init() {
  // Inicializar cliente de BD
  const dbClient = new DatabaseClient();

  // Verificar se já está autenticado
  if (!dbClient.isAuthenticated()) {
    // Mostrar tela de login
    showLoginScreen();
    return;
  }

  // Criar repositories
  const playerRepo = new PlayerRepository(dbClient);
  const matchRepo = new MatchRepository(dbClient, dbClient.userId);

  // Inicializar screens com repositories
  const screenManager = new ScreenManager({
    playerRepository: playerRepo,
    matchRepository: matchRepo,
    databaseClient: dbClient
  });

  // Mostrar primeira tela
  screenManager.showScreen('splash');
}

// Iniciar aplicação
init().catch(error => {
  console.error('Erro ao inicializar:', error);
  showErrorScreen(error.message);
});
```

---

## 🔧 Configuração de Ambiente

### `.env` para desenvolvimento
```bash
API_BASE_URL=http://localhost:3000
API_TIMEOUT=10000
DEBUG=true
NODE_ENV=development
```

### `.env` para produção
```bash
API_BASE_URL=https://api.fut5germinare.com
API_TIMEOUT=5000
DEBUG=false
NODE_ENV=production
```

---

## ⚠️ Tratamento de Erros

### Erros Comuns

```javascript
try {
  const players = await playerRepo.getAllPlayers();
} catch (error) {
  if (error.message.includes('401')) {
    // Usuário não autenticado
    redirectToLogin();
  } else if (error.message.includes('500')) {
    // Erro do servidor
    showErrorMessage('Erro no servidor, tente novamente');
  } else {
    // Erro de rede
    showErrorMessage('Falha de conexão');
  }
}
```

---

## 📊 Monitoramento

### Logs de Requisição

```javascript
// Adicionar em database-client.js
private async request(endpoint, options = {}) {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, { ... });
    const duration = performance.now() - startTime;
    
    console.log(`[API] ${options.method || 'GET'} ${endpoint} - ${response.status} (${duration}ms)`);
    
    return await response.json();
  } catch (error) {
    console.error(`[API] Erro em ${endpoint}:`, error);
    throw error;
  }
}
```

---

## 🎯 Resumo

- ✅ Banco externo via API REST
- ✅ Padrão Repository para abstração
- ✅ Cache com expiração automática
- ✅ Autenticação com tokens JWT
- ✅ Refresh token automático
- ✅ Tratamento de erros robusto
- ✅ Configuração centralizada
- ✅ Escalável para múltiplos usuários

**Próximo:** Implementar Backend API (Node.js + Express + BD)
