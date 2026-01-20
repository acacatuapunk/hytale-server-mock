const express = require('express');
const cors = require('cors');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const {Server} = require('socket.io');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 5520;
const HOST = process.env.HOST || 'localhost';

// Validação e sanitização
const sanitizeUsername = (username) => {
  if (!username || typeof username !== 'string') return null;
  return username.trim().substring(0, 32);
};

// Mock de dados do servidor Hytale
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

// Logger simples
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`)
};

// Middleware de tratamento de erro
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.path}`);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// ============================================
// Endpoints da API mockada
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(serverData.uptime)
  });
});

// Informações do servidor
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

// Autenticação
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

// Jogador entra no servidor
app.post('/api/players/join', (req, res) => {
  const username = sanitizeUsername(req.body?.username);
  
  if (!username) {
    return res.status(400).json({ error: 'Username inválido ou não fornecido' });
  }
  
  // Verificar se jogador já existe
  if (serverData.players.some(p => p.username === username)) {
    return res.status(409).json({ error: 'Jogador já conectado' });
  }
  
  // Verificar limite de jogadores
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
  logger.info(`Jogador conectado: ${username} (Total: ${serverData.players.length})`);
  
  res.status(201).json({
    success: true,
    message: 'Jogador conectado com sucesso',
    player,
    playersOnline: serverData.players.length
  });
});

// Jogador sai do servidor
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
  
  logger.info(`Jogador desconectado: ${username} (Total: ${serverData.players.length})`);
  
  res.json({
    success: true,
    message: 'Jogador desconectado',
    playersOnline: serverData.players.length
  });
});

// Lista de jogadores
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

// Raiz - Informações gerais
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

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.path });
});

// Tratamento de erros
app.use(errorHandler);

// ============================================
// Inicialização do Servidor
// ============================================

const server = http.createServer(app);
const io = new Server(server, {cors:{origin:'*'}});

// WebSocket handlers
io.on('connection', (socket) => {
  console.log('🔄 Novo cliente conectado:', socket.id);
  socket.emit('server:info', serverData);
  socket.on('disconnect', () => console.log('🔌 Cliente desconectado:', socket.id));
});

const {Server} = require('socket.io');
const path = require('path');

// Atualizar uptime a cada segundo
const uptimeInterval = setInterval(() => {
  serverData.uptime += 1;
}, 1000);

server.listen(PORT, HOST, () => {
  logger.info(`Servidor Hytale Mock iniciado com sucesso!`);
  logger.info(`Rodando em: http://${HOST}:${PORT}`);
  logger.info(`Versão: ${serverData.version}`);
});

server.on('error', (err) => {
  logger.error(`Erro no servidor: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    logger.error(`Porta ${PORT} já está em uso`);
  }
  process.exit(1);
});

// Tratamento gracioso de encerramento
const handleShutdown = (signal) => {
  logger.info(`Sinal ${signal} recebido, encerrando...`);
  clearInterval(uptimeInterval);
  
  server.close(() => {
    logger.info(`Servidor encerrado com sucesso`);
    process.exit(0);
  });
  
  // Força saída após 10 segundos
  setTimeout(() => {
    logger.error('Timeout ao encerrar, forçando saída');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.error(`Exceção não capturada: ${err.message}`);
  process.exit(1);
});
