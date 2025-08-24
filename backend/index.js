require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");

const gameRoutes = require("./routes/partieRoutes");
const socketHandlers = require("./sockets/index");

const app = express();
app.use(cors());
app.use(express.json());

// Crée le serveur HTTP et attache Socket.io
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "*"} // ajuste l'origine en prod
});

// middleware pour injecter io dans req (pour émettre depuis les contrôleurs)
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/games", gameRoutes);

// Santé
app.get("/health", (_req, res) => res.json({ ok: true }));

// Sockets
socketHandlers(io);

// Lancement
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
