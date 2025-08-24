const db = require("../config/db");

class Partie {

  // Créer une nouvelle partie
  static async create(game_type, player1_id) {
    const [result] = await db.execute(
      "INSERT INTO games (game_type, player1_id, status) VALUES (?, ?, 'waiting')",
      [game_type, player1_id]
    );
    return result.insertId; // retourne l'id de la partie
  }

  // Rejoindre une partie en attente
  static async join(partieId, player2_id) {
    const [result] = await db.execute(
      "UPDATE games SET player2_id = ?, status = 'in_progress' WHERE id = ? AND status = 'waiting'",
      [player2_id, partieId]
    );
    return result.affectedRows; // 1 si succès, 0 si la partie n'était plus en waiting
  }

  // Récupérer toutes les parties en cours (waiting + in_progress)
  static async getAllActive() {
    const [rows] = await db.execute(
      "SELECT * FROM games WHERE status IN ('waiting','in_progress') ORDER BY created_at DESC"
    );
    return rows;
  }

  // Ajouter un tour à une partie
  static async addTurn(game_id, player_id, action, result, turn_number) {
    const [res] = await db.execute(
      `INSERT INTO turns (game_id, player_id, action, result, turn_number)
       VALUES (?, ?, ?, ?, ?)`,
      [game_id, player_id, action, result, turn_number]
    );
    return res.insertId;
  }

  // Récupérer tous les tours d'une partie
  static async getTurns(game_id) {
    const [rows] = await db.execute(
      "SELECT * FROM turns WHERE game_id = ? ORDER BY turn_number ASC",
      [game_id]
    );
    return rows;
  }

  // Finir une partie
  static async finish(game_id) {
    const [res] = await db.execute(
      "UPDATE games SET status = 'finished', finished_at = NOW() WHERE id = ?",
      [game_id]
    );
    return res.affectedRows;
  }

}

module.exports = Partie;
