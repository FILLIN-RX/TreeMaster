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

  // 3️⃣ Créer la partie avec creator_id
  const [resGame] = await db.execute(
    "INSERT INTO games (name, creator_id, status) VALUES (?, ?, 'waiting')",
    [name, userId]
  );

  // 4️⃣ Récupérer la partie créée avec le nom du créateur
  const [rows] = await db.execute(
    `SELECT g.id, g.name, g.status, u.username AS creator
     FROM games g
     JOIN users u ON g.creator_id = u.id
     WHERE g.id = ?`,
    [resGame.insertId]
  );

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

    static async joinGame({ gameId, playerName }) {
    if (!gameId || !playerName) throw new Error('gameId et playerName doivent être définis')

    // Vérifie ou crée l'utilisateur
    let [users] = await db.execute('SELECT * FROM users WHERE username = ?', [playerName])
    let userId
    if (users.length === 0) {
      const [res] = await db.execute(
        'INSERT INTO users (username) VALUES (?)',
        [playerName]
      )
      userId = res.insertId
    } else {
      userId = users[0].id
    }

    // Vérifie que la partie est en waiting
    const [games] = await db.execute(
      'SELECT * FROM games WHERE id = ? AND status = "waiting"',
      [gameId]
    )
    if (games.length === 0) return null

    // Met à jour opponent_id et status
    await db.execute(
      'UPDATE games SET opponent_id = ?, status = "in_progress" WHERE id = ?',
      [userId, gameId]
    )

    // Retourne la partie jointe avec noms
    const [updated] = await db.execute(
      `SELECT g.id, g.name, g.status, u1.username AS creator, u2.username AS opponent
       FROM games g
       JOIN users u1 ON g.creator_id = u1.id
       LEFT JOIN users u2 ON g.opponent_id = u2.id
       WHERE g.id = ?`,
      [gameId]
    )

    return updated[0]
  }


}

module.exports = Game;
