// app.js
const express = require('express');
const app = express();
const authRoutes = require('./routes/auth.routes');

// Middleware pour lire le JSON du corps des requêtes
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Port d’écoute
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
