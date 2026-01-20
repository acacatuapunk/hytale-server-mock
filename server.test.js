const request = require('supertest');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Configurar app de teste
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5520;
const HOST = process.env.HOST || 'localhost';

const sanitizeUsername = (username) => {
  if (!username || typeof username !== 'string') return null;
  return username.trim().substring(0, 32);
};

const serverData = {
  name: 'Hytale Server (Mock)',
  version: '0.2.0',
  status: 'running',
  players: [],
  maxPlayers: 10,
  worldName: 'Zone 1',
  uptime: 0,
  startTime: new Date()
};

const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.path}`);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(serverData.uptime)
  });
});

app.get('/api/server/info', (req, res) => {
  res.json({
    name: serverData.name,
    version: serverData.version,
    status: serverData.status,
    worldName: serverData.worldName,
    playersOnline: serverData.players.length,
    maxPlayers: serverData.maxPlayers,
    uptime: Math.floor(serverData.uptime),
    startTime: serverData.startTime
  });
});

app.post('/api/server/auth', (req, res) => {
  const username = sanitizeUsername(req.body?.username);
  
  if (!username) {
    return res.status(400).json({ error: 'Username inválido ou não fornecido' });
  }
  
  const token = `mock-token-${uuidv4()}`;
  logger.info(`Autenticação bem-sucedida para: ${username}`);
  
  res.json({
    success: true,
    token,
    username,
    message: 'Autenticado no servidor Hytale!'
  });
});

app.post('/api/players/join', (req, res) => {
  const username = sanitizeUsername(req.body?.username);
  
  if (!username) {
    return res.status(400).json({ error: 'Username inválido ou não fornecido' });
  }
  
  if (serverData.players.some(p => p.username === username)) {
    return res.status(409).json({ error: 'Jogador já conectado' });
  }
  
  if (serverData.players.length >= serverData.maxPlayers) {
    return res.status(503).json({ error: 'Servidor cheio' });
  }
  
  const player = { 
    id: uuidv4(),
    username, 
    joinedAt: new Date(),
    x: 0,
    y: 0,
    z: 0
  };
  
  serverData.players.push(player);
  logger.info(`Jogador conectado: ${username}`);
  
  res.status(201).json({
    success: true,
    message: 'Jogador conectado com sucesso',
    player,
    playersOnline: serverData.players.length
  });
});

app.post('/api/players/leave', (req, res) => {
  const username = sanitizeUsername(req.body?.username);
  
  if (!username) {
    return res.status(400).json({ error: 'Username inválido ou não fornecido' });
  }
  
  const initialCount = serverData.players.length;
  serverData.players = serverData.players.filter(p => p.username !== username);
  
  const wasRemoved = serverData.players.length < initialCount;
  if (!wasRemoved) {
    return res.status(404).json({ error: 'Jogador não encontrado' });
  }
  
  logger.info(`Jogador desconectado: ${username}`);
  
  res.json({
    success: true,
    message: 'Jogador desconectado',
    playersOnline: serverData.players.length
  });
});

app.get('/api/players', (req, res) => {
  res.json({
    players: serverData.players.map(p => ({
      id: p.id,
      username: p.username,
      joinedAt: p.joinedAt
    })),
    count: serverData.players.length,
    maxPlayers: serverData.maxPlayers
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Hytale Server Mock',
    status: 'running',
    version: '0.2.0',
    message: 'Servidor mockado em execução',
    endpoints: {
      health: 'GET /api/health',
      serverInfo: 'GET /api/server/info',
      auth: 'POST /api/server/auth',
      playersJoin: 'POST /api/players/join',
      playersLeave: 'POST /api/players/leave',
      playersList: 'GET /api/players'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.path });
});

app.use(errorHandler);

// ============================================
// Testes
// ============================================

describe('Hytale Server Mock', () => {
  beforeEach(() => {
    serverData.players = [];
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('deve retornar informações básicas do servidor', async () => {
      const res = await request(app).get('/');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Hytale Server Mock');
      expect(res.body).toHaveProperty('status', 'running');
      expect(res.body).toHaveProperty('version', '0.2.0');
      expect(res.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /api/health', () => {
    it('deve retornar status ok', async () => {
      const res = await request(app).get('/api/health');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/server/info', () => {
    it('deve retornar informações do servidor', async () => {
      const res = await request(app).get('/api/server/info');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Hytale Server (Mock)');
      expect(res.body).toHaveProperty('version', '0.2.0');
      expect(res.body).toHaveProperty('playersOnline', 0);
      expect(res.body).toHaveProperty('maxPlayers', 10);
    });
  });

  describe('POST /api/server/auth', () => {
    it('deve autenticar com username válido', async () => {
      const res = await request(app)
        .post('/api/server/auth')
        .send({ username: 'player1' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('username', 'player1');
    });

    it('deve retornar erro com username inválido', async () => {
      const res = await request(app)
        .post('/api/server/auth')
        .send({ username: '' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar erro sem username', async () => {
      const res = await request(app)
        .post('/api/server/auth')
        .send({});
      
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/players/join', () => {
    it('deve conectar jogador com sucesso', async () => {
      const res = await request(app)
        .post('/api/players/join')
        .send({ username: 'player1' });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('player');
      expect(res.body.player).toHaveProperty('username', 'player1');
      expect(res.body).toHaveProperty('playersOnline', 1);
    });

    it('deve retornar erro ao conectar jogador duplicado', async () => {
      await request(app).post('/api/players/join').send({ username: 'player1' });
      
      const res = await request(app)
        .post('/api/players/join')
        .send({ username: 'player1' });
      
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'Jogador já conectado');
    });

    it('deve retornar erro com username inválido', async () => {
      const res = await request(app)
        .post('/api/players/join')
        .send({ username: '' });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/players', () => {
    it('deve retornar lista vazia de jogadores', async () => {
      const res = await request(app).get('/api/players');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('players');
      expect(res.body.players).toEqual([]);
      expect(res.body).toHaveProperty('count', 0);
      expect(res.body).toHaveProperty('maxPlayers', 10);
    });

    it('deve retornar lista com jogador conectado', async () => {
      await request(app).post('/api/players/join').send({ username: 'player1' });
      
      const res = await request(app).get('/api/players');
      
      expect(res.status).toBe(200);
      expect(res.body.players).toHaveLength(1);
      expect(res.body.players[0]).toHaveProperty('username', 'player1');
      expect(res.body).toHaveProperty('count', 1);
    });
  });

  describe('POST /api/players/leave', () => {
    it('deve desconectar jogador com sucesso', async () => {
      await request(app).post('/api/players/join').send({ username: 'player1' });
      
      const res = await request(app)
        .post('/api/players/leave')
        .send({ username: 'player1' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('playersOnline', 0);
    });

    it('deve retornar erro ao desconectar jogador inexistente', async () => {
      const res = await request(app)
        .post('/api/players/leave')
        .send({ username: 'player1' });
      
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Jogador não encontrado');
    });
  });

  describe('Rotas', () => {
    it('deve retornar 404 para rota inexistente', async () => {
      const res = await request(app).get('/api/inexistente');
      
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Rota não encontrada');
    });
  });
});
