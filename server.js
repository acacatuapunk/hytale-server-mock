const express = require('express');
const cors = require('cors');
const http = require('http');

const {Server} = require('socket.io');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 5520;

// Mock de dados do servidor Hytale
const serverData = {
  name: 'Hytale Server (Mock)',
  version: '0.1.0',
  status: 'running',
  players: [],
  maxPlayers: 10,
  worldName: 'Zone 1',
  uptime: 0
};

// Endpoints da API mockada
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/server/info', (req, res) => {
  res.json(serverData);
});

app.post('/api/server/auth', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  
  res.json({
    success: true,
    token: 'mock-token-' + Date.now(),
    username: username,
    message: 'Autenticado no servidor Hytale!'
  });
});

app.post('/api/players/join', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  
  if (serverData.players.length >= serverData.maxPlayers) {
    return res.status(400).json({ error: 'Servidor cheio' });
  }
  
  const player = { username, joinedAt: new Date(), id: Math.random() };
  serverData.players.push(player);
  
  res.json({
    success: true,
    message: 'Jogador conectado',
    player: player,
    playersOnline: serverData.players.length
  });
});

app.post('/api/players/leave', (req, res) => {
  const { username } = req.body;
  serverData.players = serverData.players.filter(p => p.username !== username);
  
  res.json({
    success: true,
    message: 'Jogador desconectado',
    playersOnline: serverData.players.length
  });
});

app.get('/api/players', (req, res) => {
  res.json({
    players: serverData.players,
    count: serverData.players.length,
    maxPlayers: serverData.maxPlayers
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Hytale Server Mock - Codespace',
    status: 'running',
    version: '0.1.0',
    message: 'Servidor mockado em execução no GitHub Codespace!',
    endpoints: [
      'GET /api/health',
      'GET /api/server/info',
      'POST /api/server/auth',
      'POST /api/players/join',
      'POST /api/players/leave',
      'GET /api/players'
    ]
  });
});

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

server.listen(PORT, () => {
  console.log(`\n✅ Servidor Hytale Mock iniciado!`);
  console.log(`🚀 Porta: ${PORT}`);
  console.log(`📍 Acesse em: http://localhost:${PORT}`);
  console.log(`🔗 Codespace: https://expert-space-parakeet-4gv6gqx7x4j2jgrv.github.dev`);
  console.log(`\n⚠️  IMPORTANTE: Em produção, use a porta exposta pelo Codespace!\n`);
  
  // Incrementar uptime a cada segundo
  setInterval(() => { serverData.uptime += 1; }, 1000);
});

server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado.');
    process.exit(0);
  });
});