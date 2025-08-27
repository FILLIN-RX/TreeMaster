// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/user.controller");

// Route POST /auth/register
router.post("/register", register);

//Route POST /auth/login

router.post("/login", login);

module.exports = router;
