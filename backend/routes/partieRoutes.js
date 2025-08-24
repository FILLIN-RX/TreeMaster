const express = require("express");
const router = express.Router();
const controller = require("../controllers/partieController");

// Créer une partie
router.post("/", controller.createGame);

// Lister les parties actives (waiting + in_progress)
router.get("/", controller.listGames);

// Arrêter une partie
router.patch("/:id/stop", controller.stopGame);

// Rejoindre une partie
router.post('/join/:gameId', controller.joinGame);

module.exports = router;
