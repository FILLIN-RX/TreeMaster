const db = require("../config/db");

class Game {
  static async create({ creator }) {
    const [res] = await db.execute(
      "INSERT INTO games (Creator, status) VALUES (?, 'waiting')",
      [creator]
    );
    const [rows] = await db.execute("SELECT * FROM games WHERE id = ?", [res.insertId]);
    return rows[0];
  }

  static async listActive() {
    const [rows] = await db.execute(
      "SELECT * FROM games WHERE status IN ('waiting','in_progress') ORDER BY created_at DESC"
    );
    return rows;
  }

  static async stop(id) {
    const [res] = await db.execute(
      "UPDATE games SET status = 'stopped' WHERE id = ? AND status <> 'stopped'",
      [id]
    );
    if (res.affectedRows === 0) return null;
    const [rows] = await db.execute("SELECT * FROM games WHERE id = ?", [id]);
    return rows[0];
  }

  static async joinGame({ gameId, userId }) {
  // Vérifie que la partie est en waiting
  const [rows] = await db.execute(
    "SELECT * FROM games WHERE id = ? AND status = 'waiting'",
    [gameId]
  );
  if (rows.length === 0) return null; // Partie non trouvée ou déjà commencée

  // Met à jour opponent_id et status
  await db.execute(
    "UPDATE games SET opponent_id = ?, status = 'in_progress' WHERE id = ?",
    [userId, gameId]
  );

  // Retourne la partie mise à jour
  const [updated] = await db.execute(
    `SELECT g.id, g.name, g.status, u1.username AS creator, u2.username AS opponent
     FROM games g
     JOIN users u1 ON g.creator_id = u1.id
     LEFT JOIN users u2 ON g.opponent_id = u2.id
     WHERE g.id = ?`,
    [gameId]
  );

  return updated[0];
}

}

module.exports = Game;
