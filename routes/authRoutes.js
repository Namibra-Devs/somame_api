const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, seedAdmin } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/seed-admin', seedAdmin);

module.exports = router;
