// controllers/user.controller.js
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
require('dotenv').config();


// Secret JWT (idéalement mettre dans .env)
const JWT_SECRET = process.env.JWT_SECRET;




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
// Récupérer les infos de l'utilisateur connecté
const getAccount = async (req, res) => {
  try {
    // req.user a été ajouté par authenticateUser
    const userId = req.user.id;

    // Rechercher l'utilisateur en DB sans le mot de passe
    const [rows] = await pool.query(
      'SELECT id, username, email, balance, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(rows[0]); // renvoie les infos de l'utilisateur
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
// Déconnexion (invalide le token côté client)
const logout = (req, res) => {
  // Ici pas besoin de toucher au token côté serveur
  res.json({ message: 'Déconnexion réussie, veuillez supprimer le token côté client.' });
};
// Mot de passe oublié
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Vérifier si l'email existe
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Email non trouvé' });
    }

    const user = rows[0];

    // Générer un token temporaire de reset (expire dans 15 min)
    const resetToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // 🚀 Normalement ici : envoyer par email avec un lien
    // Exemple de lien : http://localhost:3000/reset-password?token=xxxxx
    // Pour l’instant on renvoie juste le token dans la réponse
    res.json({
      message: 'Lien de réinitialisation généré (à envoyer par email)',
      resetToken
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token et nouveau mot de passe requis" });
    }

    // Vérifier le token de reset
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: "Token invalide ou expiré" });
    }

    // Récupérer l'utilisateur
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [decoded.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hashedPassword, decoded.id]);

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    console.error("Erreur reset-password:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// routes/auth.js

// ✅ Changer le mot de passe
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Ancien mot de passe incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      userId,
    ]);

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// routes/auth.js

// ✅ Mettre à jour le profil
const updateProfile = async (req, res) => {
  const { username, email } = req.body;
  const userId = req.user.id;

  try {
    // Vérifier si un email ou username existe déjà (sauf le sien)
    const [exists] = await pool.query(
      "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?",
      [username, email, userId]
    );

    if (exists.length > 0) {
      return res.status(400).json({ message: "Nom ou email déjà utilisé" });
    }

    await pool.query(
      "UPDATE users SET username = ?, email = ? WHERE id = ?",
      [username, email, userId]
    );

    res.json({ message: "Profil mis à jour avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// routes/auth.js

// ✅ Récupérer le profil de l'utilisateur connecté
const getProfile =   (req, res) => {
  try {
    // req.user vient du middleware qui a décodé le token
    const user = req.user;

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};


module.exports = { register, login, getAccount, logout, forgotPassword, resetPassword, changePassword, updateProfile, getProfile };
