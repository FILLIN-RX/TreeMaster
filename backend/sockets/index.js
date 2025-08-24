const Game = require("../models/Partie");

function socketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Liste des parties actives
    socket.on("game:list", async () => {
      try {
        const games = await Game.listActive();
        socket.emit("game:list:response", games);
      } catch (e) {
        console.error("socket game:list error", e);
        socket.emit("error", "Unable to fetch games");
      }
    });

    // Créer une partie
    socket.on("game:create", async ({ creator }) => {
      try {
        const game = await Game.create({ creator });
        // On renvoie au créateur
        socket.emit("game:created", game);
        // On notifie les autres clients
        socket.broadcast.emit("game:created", game);
      } catch (e) {
        console.error("socket game:create error", e);
        socket.emit("error", "Unable to create game");
      }
    });

    // Arrêter une partie
    socket.on("game:stop", async ({ gameId }) => {
      try {
        const game = await Game.stop(gameId);
        if (!game) return; // Partie déjà arrêtée
        socket.emit("game:stopped", game);
        socket.broadcast.emit("game:stopped", game);
      } catch (e) {
        console.error("socket game:stop error", e);
        socket.emit("error", "Unable to stop game");
      }
    });

    //rejoindre une partie
    socket.on("game:join", async ({ gameId, userId }) => {
      try {
        const game = await Game.joinGame({ gameId, userId });
        if (!game) {
          socket.emit("error", "Impossible de rejoindre cette partie");
          return;
        }
        // Notifie le joueur qui a rejoint
        socket.emit("game:joined", game);
        // Notifie tous les autres clients
        socket.broadcast.emit("game:joined", game);
      } catch (e) {
        console.error("socket game:join error", e);
        socket.emit("error", "Erreur lors du join");
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
    });
  });
}

module.exports = socketHandlers;
