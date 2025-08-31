const  pool= require('../config/db.js')

export default class Bet {
  static async create({ user_id, game_id, montant }) {
    const [result] = await pool.query(
      `INSERT INTO bets (user_id, game_id, montant) VALUES (?, ?, ?)`,
      [user_id, game_id, montant]
    );
    return { id: result.insertId, user_id, game_id, montant, statut: "active" };
  }

  static async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM bets WHERE id = ?`, [id]);
    return rows[0];
  }

  static async findAll() {
    const [rows] = await pool.query(`SELECT * FROM bets`);
    return rows;
  }

  static async cancel(id) {
    await pool.query(`UPDATE bets SET statut = 'canceled' WHERE id = ?`, [id]);
    return this.findById(id);
  }
}
