const request = require('supertest');
const app = require('../app'); // ton app Express
const pool = require('../config/db'); // connexion MySQL

describe('Tests Auth & Profil', () => {
  let token;

  beforeAll(async () => {
    // On nettoie la base pour éviter les doublons
    await pool.query("DELETE FROM users WHERE email='test@example.com'");
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Inscription d’un utilisateur', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Utilisateur créé avec succès');
  });

  test('Connexion de l’utilisateur', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();

    // Sauvegarder le token pour les tests suivants
    token = res.body.token;
  });

  test('Accéder au compte avec token', async () => {
    const res = await request(app)
      .get('/api/auth/account')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('test@example.com');
  });

  test('Mettre à jour le compte', async () => {
    const res = await request(app)
      .put('/api/auth/update-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'New Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Profil mis à jour avec succès');
  });

  test('Logout de l’utilisateur', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Déconnexion réussie');
  });

 test('Accéder au compte après logout (token toujours valide)', async () => {
  const res = await request(app)
    .get('/api/auth/account')
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(200); // le token est toujours valide
});

});
