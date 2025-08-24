const express = require("express");
const router = express.Router();
const controller = require("../controllers/partieController");

// Créer une partie
router.post("/", controller.createGame);

// Lister les parties actives (waiting + in_progress)
router.get("/", controller.listGames);

// Arrêter une partie
router.patch("/:id/stop", controller.stopGame);

module.exports = router;
