const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, seedAdmin, loginWithPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/login-with-password', loginWithPassword);
router.post('/verify-otp', verifyOTP);
router.post('/seed-admin', seedAdmin);

module.exports = router;
