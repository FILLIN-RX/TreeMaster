// middleware/authenticateUser.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // pour charger JWT_SECRET depuis .env si utilisé

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key'; // fallback pour dev

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Vérifie que le header existe et qu'il commence par "Bearer"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant ou invalide' });
  }

  // Récupérer uniquement le token (après "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // contient { id, email, iat, exp }
    next(); // passe au prochain middleware ou route
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

module.exports = authenticateUser;
