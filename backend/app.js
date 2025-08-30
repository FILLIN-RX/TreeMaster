// app.js
const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');

dotenv.config();

const app = express();
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);

module.exports = app;
