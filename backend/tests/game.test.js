const request = require('supertest');
const app = require('../app'); 
const pool = require('../config/db')

let token;
let gameId;

describe('Tests Game', () => {

beforeAll(async () => {
  const uniqueSuffix = Date.now();

  const uniqueEmail = `test${uniqueSuffix}@example.com`;
  const uniqueUsername = `TestUser${uniqueSuffix}`;

  await request(app)
    .post('/api/auth/register')
    .send({
      email: uniqueEmail,
      password: 'Password123!',
      username: uniqueUsername
    });

  const login = await request(app)
    .post('/api/auth/login')
    .send({
      email: uniqueEmail,
      password: 'Password123!'
    });

  token = login.body.token;
});



  test('Créer une partie', async () => {
    const res = await request(app)
      .post('/api/games/create') // vérifie bien que ta route est /create
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Partie Test', min_bet: 10, max_players: 4 });

    expect(res.statusCode).toBe(201);
    expect(res.body.gameId).toBeDefined();
    gameId = res.body.gameId; 
  });

  test('Lister les parties', async () => {
    const res = await request(app)
      .get('/api/games')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.games)).toBe(true);
  });

  test('Détails d’une partie', async () => {
    const res = await request(app)
      .get(`/api/games/${gameId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.game.id).toBe(Number(gameId)); // cast si besoin
  });

  test('Rejoindre une partie', async () => {
    const res = await request(app)
      .post(`/api/games/${gameId}/join`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Rejoint la partie');
  });

  test('Quitter une partie', async () => {
    const res = await request(app)
      .post(`/api/games/${gameId}/leave`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Quitte la partie');
  });
  afterAll(async () => {
  await pool.end(); // ferme le pool MySQL
});
});
