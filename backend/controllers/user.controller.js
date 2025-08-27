// controllers/user.controller.js
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Secret JWT (idéalement mettre dans .env)
const JWT_SECRET = 'ton_secret_super_secure';




// Middleware de validation avant création
const registerValidation = [
  body('username').notEmpty().withMessage('Username obligatoire'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe min 6 caractères'),
];

// Contrôleur d’inscription
const register = [
  registerValidation, // Valide d'abord les données
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      // Vérifier si l'email existe déjà
      const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length > 0) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }

      // Hacher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insérer l'utilisateur
      await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },
  
];

const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];

const login = [
  loginValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Chercher l’utilisateur par email
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
      }

      const user = rows[0];

      // Comparer le mot de passe fourni et le hash stocké
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
      }

      // Générer un JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ token, message: 'Connexion réussie' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  },
];

module.exports = { register ,login};
