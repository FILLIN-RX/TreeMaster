// app.js
const express = require('express');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth.routes');
const gameroutes = require('./routes/game.routes')




dotenv.config();

const app = express();
app.use(express.json());


// routes
app.use('/api/auth', authRoutes);
app.use('/api/games',gameroutes)

module.exports = app;
