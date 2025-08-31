// routes/game.routes.js
const express = require('express');
const router = express.Router();
const  authenticateUser  = require('../middleware/authenticateUser');
const {listGames,createGame,getGame,getGames,joinGame,leaveGame} = require('../controllers/game.controller');

// Liste toutes les parties avec pagination et filtre
router.get('/', authenticateUser, listGames);

// Créer une nouvelle partie
router.post('/create', authenticateUser, createGame);

// Détails d’une partie
router.get('/:id', authenticateUser,getGame);

// Rejoindre une partie
router.post('/:id/join', authenticateUser,joinGame);

// Quitter une partie
router.post('/:id/leave', authenticateUser, leaveGame);

module.exports = router;
