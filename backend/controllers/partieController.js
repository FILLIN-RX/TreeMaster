const Game = require("../models/Partie");

exports.createGame = async (req, res) => {
  try {
    const { creator } = req.body;
    if (!creator || typeof creator !== "string") {
      return res.status(400).json({ error: "creator is required (string)" });
    }
    const game = await Game.create({ creator });

    // émettre en temps réel
    req.io.emit("game:created", game);

    return res.status(201).json(game);
  } catch (err) {
    console.error("createGame error:", err);
    return res.status(500).json({ error: "Internal server error" });
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
    req.io.emit("game:stopped", game);

    return res.json({ message: "Game stopped", game });
  } catch (err) {
    console.error("stopGame error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
