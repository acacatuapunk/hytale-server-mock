# Hytale Server Mock

Servidor Hytale mockado em Node.js para testes. Simula a API do servidor e permite conexões de clientes.

## Características

- ✅ API RESTful completa
- 🔐 Autenticação mockada
- 👥 Gerenciamento de jogadores
- 📊 Informações do servidor
- 🛡️ Tratamento de erros robusto
- 🔍 Logging estruturado

## Instalação

```bash
npm install
```

## Uso

```bash
npm start
```

O servidor estará disponível em `http://localhost:5520`

## Endpoints

### Health Check
```
GET /api/health
```
Retorna status do servidor e uptime.

### Informações do Servidor
```
GET /api/server/info
```
Retorna dados do servidor, jogadores online e configurações.

### Autenticação
```
POST /api/server/auth
Body: { "username": "seu_nick" }
```
Retorna token de autenticação para o jogador.

### Entrar no Servidor
```
POST /api/players/join
Body: { "username": "seu_nick" }
```
Conecta um jogador ao servidor.

### Sair do Servidor
```
POST /api/players/leave
Body: { "username": "seu_nick" }
```
Desconecta um jogador do servidor.

### Listar Jogadores
```
GET /api/players
```
Retorna lista de todos os jogadores online.

## Variáveis de Ambiente

- `PORT` - Porta do servidor (padrão: 5520)
- `HOST` - Host do servidor (padrão: localhost)
- `NODE_ENV` - Ambiente (development/production)

## Exemplos de Uso

### Com cURL

```bash
# Health check
curl http://localhost:5520/api/health

# Autenticar
curl -X POST http://localhost:5520/api/server/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"player1"}'

# Entrar no servidor
curl -X POST http://localhost:5520/api/players/join \
  -H "Content-Type: application/json" \
  -d '{"username":"player1"}'

# Listar jogadores
curl http://localhost:5520/api/players
```

## Licença

ISC
