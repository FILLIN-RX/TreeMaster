function socketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Le client peut demander la liste à chaud
    socket.on("game:list", async () => {
      try {
        // On n’importe pas directement le modèle ici pour éviter des cycles;
        // Si tu veux, tu peux créer un service dédié. Pour la démo:
        const db = require("../config/db");
        const [rows] = await db.execute(
          "SELECT * FROM games WHERE status IN ('waiting','in_progress') ORDER BY created_at DESC"
        );
        socket.emit("game:list:response", rows);
      } catch (e) {
        console.error("socket game:list error", e);
        socket.emit("error", "Unable to fetch games");
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
    });
  });
}

module.exports = socketHandlers;
