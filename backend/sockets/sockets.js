// socket.js
let io;

/**
 * Initialise Socket.IO avec le serveur HTTP
 * @param {http.Server} server - instance du serveur Express
 */
function initSocket(server) {
  io = require('socket.io')(server, {
    cors: { origin: '*' } // à restreindre en production
  });

  io.on('connection', (socket) => {
    console.log('Nouvel utilisateur connecté :', socket.id);

    // Événements parties
    socket.on('new-game', (game) => {
      io.emit('new-game', game); // diffuse à tous les clients
    });

    socket.on('join-game', ({ gameId, user }) => {
      io.emit('join-game', { gameId, user });
    });

    socket.on('leave-game', ({ gameId, user }) => {
      io.emit('leave-game', { gameId, user });
    });

    // Événements mises
    socket.on('new-bet', ({ betId, userId, gameId, montant }) => {
      io.emit('new-bet', { betId, userId, gameId, montant });
    });

    socket.on('cancel-bet', ({ betId, userId }) => {
      io.emit('cancel-bet', { betId, userId });
    });

    socket.on('disconnect', () => {
      console.log('Utilisateur déconnecté :', socket.id);
    });
  });
}

/**
 * Récupère l'instance Socket.IO
 * @returns {Server} instance de Socket.IO
 */
function getIO() {
  if (!io) throw new Error('Socket.io non initialisé !');
  return io;
}

module.exports = { initSocket, getIO };
