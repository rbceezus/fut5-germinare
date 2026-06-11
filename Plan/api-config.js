/**
 * API Configuration
 * 
 * Configuração centralizada para acesso à API externa
 * Sem hard code de URLs ou credenciais
 */

export const API_CONFIG = {
  // URL base da API
  baseUrl: process.env.API_BASE_URL || 'https://api.fut5germinare.com',

  // Timeout para requisições em ms
  timeout: parseInt(process.env.API_TIMEOUT) || 5000,

  // Retry configuration
  retry: {
    attempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 3,
    delay: parseInt(process.env.API_RETRY_DELAY) || 1000
  },

  // Endpoints da API
  endpoints: {
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      register: '/auth/register'
    },
    players: {
      list: '/players',
      search: '/players/search',
      byId: '/players/:id'
    },
    matches: {
      list: '/matches',
      create: '/matches',
      byId: '/matches/:id',
      update: '/matches/:id',
      delete: '/matches/:id',
      byUser: '/users/:userId/matches'
    },
    users: {
      profile: '/users/:id',
      stats: '/users/:id/stats',
      history: '/users/:id/matches'
    }
  }
};

/**
 * Storage Keys
 * Chaves para localStorage
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
  USER_NAME: 'user_name',
  LAST_LOGIN: 'last_login'
};

/**
 * HTTP Headers padrão
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'Fut5Germinare/1.0'
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Error Messages
 */
export const API_ERRORS = {
  NETWORK_ERROR: 'Falha de conexão com o servidor',
  TIMEOUT: 'Requisição expirou. Tente novamente',
  UNAUTHORIZED: 'Você não está autenticado',
  FORBIDDEN: 'Acesso negado',
  NOT_FOUND: 'Recurso não encontrado',
  INVALID_REQUEST: 'Requisição inválida',
  SERVER_ERROR: 'Erro no servidor. Tente novamente',
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente'
};

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  // Tempo de expiração padrão em ms (5 minutos)
  defaultExpiry: 5 * 60 * 1000,

  // Tempo para diferentes tipos de dados
  expiry: {
    players: 10 * 60 * 1000,      // 10 minutos
    matches: 5 * 60 * 1000,       // 5 minutos
    userProfile: 30 * 60 * 1000,  // 30 minutos
    stats: 15 * 60 * 1000         // 15 minutos
  }
};

/**
 * Request Interceptors
 * Hook para modificar requisições antes de enviar
 */
export function beforeRequest(config) {
  // Adicionar logging em desenvolvimento
  if (process.env.DEBUG === 'true') {
    console.log(`[API] ${config.method} ${config.url}`);
  }
  return config;
}

/**
 * Response Interceptors
 * Hook para processar respostas
 */
export function afterResponse(response) {
  // Processar resposta bem-sucedida
  if (response.ok) {
    return response;
  }

  // Lançar erro com status
  const error = new Error(API_ERRORS.UNKNOWN_ERROR);
  error.status = response.status;
  throw error;
}

/**
 * Environment-specific configuration
 */
export const ENV_CONFIG = {
  development: {
    baseUrl: 'http://localhost:3000',
    debug: true,
    timeout: 10000
  },
  staging: {
    baseUrl: 'https://staging-api.fut5germinare.com',
    debug: true,
    timeout: 5000
  },
  production: {
    baseUrl: 'https://api.fut5germinare.com',
    debug: false,
    timeout: 5000
  }
};

/**
 * Obter configuração baseado no ambiente
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'production';
  return ENV_CONFIG[env] || ENV_CONFIG.production;
}

/**
 * Merge configurações
 * Sobrescreve defaults com env vars
 */
export function mergeConfig() {
  const envConfig = getEnvironmentConfig();
  return {
    ...API_CONFIG,
    baseUrl: envConfig.baseUrl,
    debug: envConfig.debug,
    timeout: envConfig.timeout
  };
}
