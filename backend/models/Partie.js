const db = require("../config/db");

class Game {
  static async create({ creator }) {
    const [res] = await db.execute(
      "INSERT INTO games (Creator, status) VALUES (?, 'in_progress')",
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
}

module.exports = Game;
