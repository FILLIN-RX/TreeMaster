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

// Marquer un joueur comme prêt
router.post('/:gameId/ready', controller.setPlayerReady);

// Récupérer l'état d'une partie
router.get('/:gameId/state', controller.getGameState);

// Terminer une partie
router.post('/end/:gameId', controller.endGame);

module.exports = router;