// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authenticateUser = require('../middleware/authenticateUser')
const { register, login,getAccount } = require("../controllers/user.controller");

// Route POST /auth/register
router.post("/register", register);

//Route POST /auth/login

router.post("/login", login);

router.get('/account', authenticateUser, getAccount);
module.exports = router;
