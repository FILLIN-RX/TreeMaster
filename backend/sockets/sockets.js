// socket.js
let io;

function initSocket(server) {
  io = require('socket.io')(server, {
    cors: { origin: '*' } // à restreindre en production
  });

  io.on('connection', (socket) => {
    console.log('Nouvel utilisateur connecté :', socket.id);

    socket.on('new-game', (game) => {
      io.emit('new-game', game);
    });

    socket.on('join-game', ({ gameId, user }) => {
      io.emit('join-game', { gameId, user });
    });

    socket.on('leave-game', ({ gameId, user }) => {
      io.emit('leave-game', { gameId, user });
    });

    socket.on('disconnect', () => {
      console.log('Utilisateur déconnecté :', socket.id);
    });
  });
}

function getIO() {
  if (!io) throw new Error('Socket.io non initialisé !');
  return io;
}

module.exports = { initSocket, getIO };
