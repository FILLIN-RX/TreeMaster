const pool = require("../config/db");
const { getIO } = require("../sockets/sockets");

/**
 * Liste toutes les mises dans la base de données.
 * Route : GET /api/bets
 * Auth : Requise
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.listBets = async (req, res) => {
  try {
    // Récupération de toutes les mises
    const [bets] = await pool.query("SELECT * FROM bets");

    // On renvoie un objet JSON contenant la liste
    res.json({ bets });
  } catch (err) {
    console.error("Erreur lors de la récupération des mises :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Crée une nouvelle mise pour un utilisateur sur une partie donnée.
 * Route : POST /api/bets/create
 * Auth : Requise
 *
 * Règles métier :
 * - Vérifier que l'utilisateur a suffisamment de solde.
 * - Vérifier que la partie est en cours.
 * - Déduire le montant du solde.
 * - Émettre un événement Socket.IO "new-bet".
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.createBet = async (req, res) => {
  const { game_id, montant } = req.body;
  const user_id = req.user.id; // Récupéré via middleware d'authentification

  try {
    // Vérifier le solde de l'utilisateur
    const [[user]] = await pool.query("SELECT balance FROM users WHERE id = ?", [user_id]);
    if (!user || user.balance < montant)
      return res.status(400).json({ message: "Solde insuffisant" });

   // Vérifier que la partie est en cours
const [[game]] = await pool.query("SELECT status FROM Game WHERE id = ?", [game_id]);
if (!game || game.status !== "in_progress") 
  return res.status(400).json({ message: "Partie non active" });

    // Insérer la mise dans la table bets
    const [result] = await pool.query(
      "INSERT INTO bets (user_id, game_id, montant) VALUES (?, ?, ?)",
      [user_id, game_id, montant]
    );

    // Déduire le montant du solde de l'utilisateur
    await pool.query("UPDATE users SET balance = balance - ? WHERE id = ?", [montant, user_id]);

    // Émettre l'événement Socket.IO pour notifier tous les clients
    getIO().emit("new-bet", { id: result.insertId, user_id, game_id, montant });

    res.status(201).json({ message: "Mise placée", betId: result.insertId });
  } catch (err) {
    console.error("Erreur lors de la création d'une mise :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Récupère les détails d'une mise spécifique.
 * Route : GET /api/bets/:id
 * Auth : Requise
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.getBet = async (req, res) => {
  const betId = req.params.id;

  try {
    const [bets] = await pool.query("SELECT * FROM bets WHERE id = ?", [betId]);

    if (!bets.length) return res.status(404).json({ message: "Mise introuvable" });

    res.json({ bet: bets[0] });
  } catch (err) {
    console.error(`Erreur lors de la récupération de la mise ${betId} :`, err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Annule une mise.
 * Route : POST /api/bets/:id/cancel
 * Auth : Requise
 *
 * Règles métier :
 * - Vérifier que la mise appartient à l'utilisateur.
 * - Vérifier que la mise est active.
 * - Rembourser le solde de l'utilisateur.
 * - Émettre un événement Socket.IO "cancel-bet".
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.cancelBet = async (req, res) => {
  const betId = req.params.id;
  const userId = req.user.id;

  try {
    // Vérifier que la mise existe et appartient à l'utilisateur
    const [bets] = await pool.query("SELECT * FROM bets WHERE id = ? AND user_id = ?", [betId, userId]);
    if (!bets.length) return res.status(404).json({ message: "Mise introuvable" });

    // Vérifier que la mise est active
    if (bets[0].statut !== "active")
      return res.status(400).json({ message: "Mise déjà annulée ou réglée" });

    // Mettre à jour le statut de la mise
    await pool.query("UPDATE bets SET statut = 'canceled' WHERE id = ?", [betId]);

    // Rembourser le solde de l'utilisateur
    await pool.query("UPDATE users SET balance = balance + ? WHERE id = ?", [bets[0].montant, userId]);

    // Émettre un événement Socket.IO pour notifier tous les clients
    getIO().emit("cancel-bet", { betId, userId });

    res.json({ message: "Mise annulée" });
  } catch (err) {
    console.error(`Erreur lors de l'annulation de la mise ${betId} :`, err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
