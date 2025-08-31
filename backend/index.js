// index.js
const app = require('./app');
const http = require('http');
const { initSocket } = require('./sockets/sockets');
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialise les sockets sur ce serveur
initSocket(server);

// Utilise le même serveur pour écouter le port
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
