// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authenticateUser = require('../middleware/authenticateUser')
const { register, login,getAccount,logout,forgotPassword,resetPassword,getProfile,changePassword,updateProfile } = require("../controllers/user.controller");

// Route POST /auth/register
router.post("/register", register);

//Route POST /auth/login

router.post("/login", login);

router.get('/account', authenticateUser, getAccount);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateUser, changePassword);
router.put('/update-profile', authenticateUser, updateProfile);
router.get('/profile', authenticateUser, getProfile);

module.exports = router;
