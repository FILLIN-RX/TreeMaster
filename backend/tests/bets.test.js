// tests/bets.test.js
const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");
const { getIO } = require("../sockets/sockets");

let token;
let betId;
let gameId;
let userId;

// Mock Socket.IO pour éviter d’émettre réellement pendant les tests
jest.mock("../sockets/sockets", () => ({
  getIO: jest.fn(() => ({
    emit: jest.fn(),
  })),
}));

describe("Tests Bets", () => {
  beforeAll(async () => {
    // Créer un utilisateur
    const email = `test${Date.now()}@example.com`;
    const username = `TestUser${Date.now()}`;
    await request(app)
      .post("/api/auth/register")
      .send({ email, password: "Password123!", username });

    // Connexion pour récupérer le token
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });

    token = login.body.token;

    // Récupérer l'ID utilisateur pour créditer le solde
    const [[user]] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    userId = user.id;

    await pool.query("UPDATE users SET balance = ? WHERE id = ?", [100, userId]);

    // Créer une partie active
    const [resGame] = await pool.query(
      "INSERT INTO Game (title, min_bet, max_players, status) VALUES (?, ?, ?, ?)",
      ["Partie Test", 10, 4, "in_progress"]
    );
    gameId = resGame.insertId;

    // Créer une partie inactive pour test partie non active
    await pool.query(
      "INSERT INTO Game (title, min_bet, max_players, status) VALUES (?, ?, ?, ?)",
      ["Partie Inactive", 10, 4, "waiting"]
    );
  });

  afterAll(async () => {
    await pool.query("DELETE FROM bets");
    await pool.query("DELETE FROM Game");
    await pool.query("DELETE FROM users WHERE id = ?", [userId]);
    await pool.end();
  });

  test("Lister toutes les mises", async () => {
    const res = await request(app)
      .get("/api/bets")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.bets)).toBe(true);
  });

  test("Créer une mise valide", async () => {
    const res = await request(app)
      .post("/api/bets/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ game_id: gameId, montant: 20 });

    expect(res.statusCode).toBe(201);
    expect(res.body.betId).toBeDefined();
    betId = res.body.betId;
  });

  test("Créer une mise avec solde insuffisant", async () => {
    const res = await request(app)
      .post("/api/bets/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ game_id: gameId, montant: 1000 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Solde insuffisant");
  });

  test("Créer une mise sur partie inactive", async () => {
    const [[inactiveGame]] = await pool.query("SELECT id FROM Game WHERE status = 'waiting'");
    const res = await request(app)
      .post("/api/bets/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ game_id: inactiveGame.id, montant: 10 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Partie non active");
  });

  test("Récupérer les détails d'une mise", async () => {
    const res = await request(app)
      .get(`/api/bets/${betId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.bet.id).toBe(betId);
  });

  test("Annuler une mise", async () => {
    const res = await request(app)
      .post(`/api/bets/${betId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Mise annulée");
  });

  test("Ne peut pas annuler une mise déjà annulée", async () => {
    const res = await request(app)
      .post(`/api/bets/${betId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Mise déjà annulée ou réglée");
  });
});
