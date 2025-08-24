const express = require("express");
const router = express.Router();
const partieController = require("../controllers/partieController");

// Créer une partie
router.post("/", partieController.creerPartie);

// Lister les parties en cours
router.get("/", partieController.listerParties);

module.exports = router;
