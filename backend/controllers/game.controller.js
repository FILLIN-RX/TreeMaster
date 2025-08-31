// controllers/game.controller.js
const pool = require('../config/db');
const { getIO } = require('../sockets/sockets');

function safeEmit(event, data) {
  try {
    const io = getIO();
    io.emit(event, data);
  } catch (err) {
    // En test, on ignore si socket n’est pas initialisé
    if (process.env.NODE_ENV !== 'test') {
      console.error(err);
    }
  }
}
// Liste toutes les parties avec pagination et filtre
exports.listGames = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    let query = 'SELECT * FROM Game';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * limit);

    const [games] = await pool.query(query, params);
    res.json({ games });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.createGame = async (req, res) => {
  try {
    const { title, min_bet, max_players } = req.body;

    const [result] = await pool.query(
      'INSERT INTO Game (title, min_bet, max_players) VALUES (?, ?, ?)',
      [title, min_bet, max_players]
    );

    const game = { id: result.insertId, title, min_bet, max_players };
    safeEmit('new-game', game);

    res.status(201).json({ message: 'Partie créée', gameId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getGame = async (req, res) => {
  try {
    const gameId = req.params.id;
    const [gameRows] = await pool.query('SELECT * FROM Game WHERE id = ?', [gameId]);

    if (!gameRows.length) return res.status(404).json({ message: 'Partie introuvable' });

    const [players] = await pool.query(
      'SELECT user_id FROM GamePlayers WHERE game_id = ?',
      [gameId]
    );

    res.json({ game: gameRows[0], players });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


exports.getGames = async (req, res) => {
  const [gameRows] = await pool.query('SELECT * FROM Game');
  res.json({ games: gameRows });
};

exports.joinGame = async (req, res) => {
  const gameId = req.params.id;
  const userId = req.user.id;

  try {
    // Vérifier si la partie existe
    const [gameRows] = await pool.query('SELECT * FROM Game WHERE id = ?', [gameId]);
    if (!gameRows.length) return res.status(404).json({ message: 'Partie introuvable' });

    const game = gameRows[0];

    // Vérifier si la partie est pleine
    const [players] = await pool.query('SELECT * FROM GamePlayers WHERE game_id = ?', [gameId]);
    if (players.length >= game.max_players) return res.status(400).json({ message: 'Partie pleine' });

    // Vérifier si l’utilisateur est déjà dans la partie
    if (players.find(p => p.user_id === userId)) {
      return res.status(400).json({ message: 'Vous êtes déjà dans la partie' });
    }

    // Ajouter l’utilisateur à la partie
    await pool.query('INSERT INTO GamePlayers (game_id, user_id) VALUES (?, ?)', [gameId, userId]);

    // TODO : émettre un socket "join-game" ici si Socket.IO est configuré
   safeEmit('join-game', { gameId, userId });


    res.json({ message: 'Rejoint la partie' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


exports.leaveGame = async (req, res) => {
  const gameId = req.params.id;
  const userId = req.user.id;

  try {
    // Vérifier si l’utilisateur est dans la partie
    const [players] = await pool.query(
      'SELECT * FROM GamePlayers WHERE game_id = ? AND user_id = ?',
      [gameId, userId]
    );

    if (!players.length) return res.status(400).json({ message: 'Vous n’êtes pas dans cette partie' });

    // Supprimer l’utilisateur de la partie
    await pool.query('DELETE FROM GamePlayers WHERE game_id = ? AND user_id = ?', [gameId, userId]);

    // TODO : émettre un socket "leave-game" ici si Socket.IO est configuré
    safeEmit('leave-game', { gameId, userId });

    res.json({ message: 'Quitte la partie' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
