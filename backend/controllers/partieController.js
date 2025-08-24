const Game = require("../models/Partie");

exports.createGame = async (req, res) => {
  try {
    const { username, name } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Le nom du joueur (username) est requis" });
    }
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Le nom de la partie (name) est requis" });
    }

    // Créer la partie via le modèle
    const game = await Game.create({ username, name });

    // Émettre l'événement Socket.io en temps réel
    if (req.io) {
      req.io.emit("game:created", game);
    }

    return res.status(201).json(game);
  } catch (err) {
    console.error("createGame error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.joinGame = async (req, res) => {
  const { gameId } = req.params;
  const { playerName } = req.body;

  if (!gameId || !playerName) {
    return res.status(400).json({ error: 'gameId et playerName doivent être définis' });
  }

  try {
    const game = await Game.joinGame({ gameId, playerName });
    if (!game) return res.status(404).json({ error: 'Partie introuvable ou déjà commencée' });

    // Optionnel: émettre via Socket.io si tu veux temps réel
    if (req.io) req.io.emit('game:joined', game);

    res.json({ game });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

exports.listGames = async (_req, res) => {
  try {
    const games = await Game.listActive();
    return res.json(games);
  } catch (err) {
    console.error("listGames error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.stopGame = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.stop(id);
    if (!game) return res.status(404).json({ error: "Game not found or already stopped" });

    // émettre en temps réel
    if (req.io) req.io.emit("game:stopped", game);

    return res.json({ message: "Game stopped", game });
  } catch (err) {
    console.error("stopGame error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Nouvelle méthode pour marquer un joueur comme prêt
exports.setPlayerReady = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;

    if (!gameId || !playerId) {
      return res.status(400).json({ error: 'gameId et playerId doivent être définis' });
    }

    const game = await Game.setPlayerReady({ gameId, playerId });
    if (!game) return res.status(404).json({ error: 'Partie introuvable' });

    // Émettre l'événement Socket.io
    if (req.io) req.io.emit('game:player-ready', game);

    res.json({ game });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};

// Nouvelle méthode pour récupérer l'état d'une partie
exports.getGameState = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.getGameState(gameId);
    
    if (!game) return res.status(404).json({ error: 'Partie introuvable' });
    
    res.json({ gameState: game });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
};