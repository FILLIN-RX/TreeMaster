const db = require("../config/db");

class Game {
  static async create({ username, name }) {
    if (!username) throw new Error("Le nom du joueur est requis");
    if (!name) throw new Error("Le nom de la partie est requis");

    // 1️⃣ Vérifier si l'utilisateur existe
    let [users] = await db.execute("SELECT id FROM users WHERE username = ?", [username]);
    let userId;

    if (users.length > 0) {
      userId = users[0].id; // utilisateur existant
    } else {
      // 2️⃣ Sinon, créer l'utilisateur
      const [resUser] = await db.execute("INSERT INTO users (username) VALUES (?)", [username]);
      userId = resUser.insertId;
    }

    // 3️⃣ Créer la partie
    const [resGame] = await db.execute(
      "INSERT INTO games (name, status) VALUES (?, 'waiting')",
      [name]
    );

    // 4️⃣ Ajouter le créateur comme joueur
    await db.execute(
      "INSERT INTO game_players (game_id, user_id, is_creator) VALUES (?, ?, TRUE)",
      [resGame.insertId, userId]
    );

    // 5️⃣ Récupérer la partie créée avec les informations des joueurs
    const [rows] = await db.execute(
      `SELECT g.id, g.name, g.status, g.created_at,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', u.id,
                  'username', u.username,
                  'is_creator', gp.is_creator,
                  'is_ready', gp.is_ready,
                  'points', gp.points,
                  'joined_at', gp.joined_at
                )
              ) as players
       FROM games g
       JOIN game_players gp ON g.id = gp.game_id
       JOIN users u ON gp.user_id = u.id
       WHERE g.id = ?
       GROUP BY g.id`,
      [resGame.insertId]
    );

    const game = rows[0];
    // Vérifier si players est déjà un objet ou une chaîne JSON
    if (typeof game.players === 'string') {
      game.players = JSON.parse(game.players);
    }
    return game;
  }

  static async listActive() {
    const [rows] = await db.execute(
      `SELECT g.*, 
              COUNT(gp.user_id) as player_count,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', u.id,
                  'username', u.username,
                  'is_creator', gp.is_creator,
                  'is_ready', gp.is_ready,
                  'points', gp.points,
                  'joined_at', gp.joined_at
                )
              ) as players
       FROM games g
       JOIN game_players gp ON g.id = gp.game_id
       JOIN users u ON gp.user_id = u.id
       WHERE g.status IN ('waiting','in_progress') 
       GROUP BY g.id
       ORDER BY g.created_at DESC`
    );
    
    // Corriger le parsing JSON
    return rows.map(row => {
      if (row.players && typeof row.players === 'string') {
        try {
          row.players = JSON.parse(row.players);
        } catch (e) {
          console.error("Erreur parsing JSON players:", e);
          row.players = [];
        }
      } else if (!row.players) {
        row.players = [];
      }
      return row;
    });
  }

  static async stop(id) {
    const [res] = await db.execute(
      "UPDATE games SET status = 'stopped' WHERE id = ? AND status <> 'stopped'",
      [id]
    );
    if (res.affectedRows === 0) return null;
    
    const [rows] = await db.execute(
      `SELECT g.*, 
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', u.id,
                  'username', u.username,
                  'is_creator', gp.is_creator,
                  'is_ready', gp.is_ready,
                  'points', gp.points,
                  'joined_at', gp.joined_at
                )
              ) as players
       FROM games g
       JOIN game_players gp ON g.id = gp.game_id
       JOIN users u ON gp.user_id = u.id
       WHERE g.id = ?
       GROUP BY g.id`,
      [id]
    );
    
    if (rows.length === 0) return null;
    
    const game = rows[0];
    // Vérifier si players est déjà un objet ou une chaîne JSON
    if (typeof game.players === 'string') {
      game.players = JSON.parse(game.players);
    }
    return game;
  }

  static async joinGame({ gameId, playerName }) {
    if (!gameId || !playerName) throw new Error('gameId et playerName doivent être définis');

    // Vérifie ou crée l'utilisateur
    let [users] = await db.execute('SELECT * FROM users WHERE username = ?', [playerName]);
    let userId;
    
    if (users.length === 0) {
      const [res] = await db.execute('INSERT INTO users (username) VALUES (?)', [playerName]);
      userId = res.insertId;
    } else {
      userId = users[0].id;
    }

    // Vérifie que la partie est en waiting
    const [games] = await db.execute(
      'SELECT * FROM games WHERE id = ? AND status = "waiting"',
      [gameId]
    );
    if (games.length === 0) return null;

    // Vérifie si le joueur n'est pas déjà dans la partie
    const [existingPlayers] = await db.execute(
      'SELECT * FROM game_players WHERE game_id = ? AND user_id = ?',
      [gameId, userId]
    );
    
    if (existingPlayers.length > 0) {
      throw new Error('Vous êtes déjà dans cette partie');
    }

    // Ajoute le joueur à la partie
    await db.execute(
      'INSERT INTO game_players (game_id, user_id) VALUES (?, ?)',
      [gameId, userId]
    );

    // Vérifie le nombre de joueurs et passe en in_progress si nécessaire
    const [playerCount] = await db.execute(
      'SELECT COUNT(*) as count FROM game_players WHERE game_id = ?',
      [gameId]
    );
    
    if (playerCount[0].count >= 2) { // On peut ajuster ce nombre selon les besoins
      await db.execute(
        'UPDATE games SET status = "in_progress" WHERE id = ?',
        [gameId]
      );
    }

    // Retourne la partie jointe avec les informations des joueurs
    const [updated] = await db.execute(
      `SELECT g.id, g.name, g.status, g.created_at,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', u.id,
                  'username', u.username,
                  'is_creator', gp.is_creator,
                  'is_ready', gp.is_ready,
                  'points', gp.points,
                  'joined_at', gp.joined_at
                )
              ) as players
       FROM games g
       JOIN game_players gp ON g.id = gp.game_id
       JOIN users u ON gp.user_id = u.id
       WHERE g.id = ?
       GROUP BY g.id`,
      [gameId]
    );

    if (updated.length === 0) return null;
    
    const game = updated[0];
    // Vérifier si players est déjà un objet ou une chaîne JSON
    if (typeof game.players === 'string') {
      game.players = JSON.parse(game.players);
    }
    return game;
  }

  // Nouvelle méthode pour marquer un joueur comme prêt
  static async setPlayerReady({ gameId, playerId }) {
    await db.execute(
      'UPDATE game_players SET is_ready = TRUE WHERE game_id = ? AND user_id = ?',
      [gameId, playerId]
    );

    // Vérifie si tous les joueurs sont prêts
    const [readyCount] = await db.execute(
      'SELECT COUNT(*) as ready_count FROM game_players WHERE game_id = ? AND is_ready = TRUE',
      [gameId]
    );
    
    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as total_count FROM game_players WHERE game_id = ?',
      [gameId]
    );

    // Si tous les joueurs sont prêts, on peut démarrer la partie
    if (readyCount[0].ready_count === totalCount[0].total_count && totalCount[0].total_count >= 2) {
      await db.execute(
        'UPDATE games SET status = "in_progress" WHERE id = ?',
        [gameId]
      );
    }

    return this.getGameState(gameId);
  }

  // Méthode pour récupérer l'état complet d'une partie
  static async getGameState(gameId) {
    const [rows] = await db.execute(
      `SELECT g.id, g.name, g.status, g.created_at,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', u.id,
                  'username', u.username,
                  'is_creator', gp.is_creator,
                  'is_ready', gp.is_ready,
                  'points', gp.points,
                  'joined_at', gp.joined_at
                )
              ) as players
       FROM games g
       JOIN game_players gp ON g.id = gp.game_id
       JOIN users u ON gp.user_id = u.id
       WHERE g.id = ?
       GROUP BY g.id`,
      [gameId]
    );

    if (rows.length === 0) return null;
    
    const game = rows[0];
    // Vérifier si players est déjà un objet ou une chaîne JSON
    if (typeof game.players === 'string') {
      game.players = JSON.parse(game.players);
    } else if (!game.players) {
      game.players = [];
    }
    
    // Déterminer le joueur actuel (pourrait être basé sur un tour)
    // Pour l'instant, on prend le premier joueur
    if (game.players.length > 0) {
      game.currentPlayer = game.players[0].id;
    }
    
    return game;
  }

  // Méthode simple pour récupérer une partie par ID (sans les joueurs)
  static async findById(id) {
    const [rows] = await db.execute(
      "SELECT * FROM games WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = Game;