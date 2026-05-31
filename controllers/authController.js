const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { pool } = require('../config/db');

// Helper to generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { phone_number, password, role } = req.body;
    
    if (!phone_number || !password || !role) {
      return res.status(400).json({ status: 'error', message: 'Please provide all required fields' });
    }

    if (!['customer', 'rider', 'vendor'].includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Invalid role specified' });
    }

    const userExists = await User.findByPhoneNumber(phone_number);
    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'User with this phone number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp_code = generateOTP();
    const otp_expires_at = new Date(Date.now() + 10 * 60000); // 10 minutes from now

    // Create user (is_verified defaults to false in schema)
    const user = await User.create({ phone_number, password_hash, role, otp_code, otp_expires_at });

    // Mock sending SMS
    console.log(`\n\n[MOCK SMS] To: ${phone_number} | Message: Your Somame API verification code is: ${otp_code}\n\n`);

    res.status(201).json({
      status: 'success',
      message: 'Registration initiated. OTP sent to phone number.',
      data: {
        userId: user.id,
        phone_number: user.phone_number
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { phone_number } = req.body; // Password removed

    if (!phone_number) {
      return res.status(400).json({ status: 'error', message: 'Please provide a phone number' });
    }

    const user = await User.findByPhoneNumber(phone_number);

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    /* 
    // Commented out password check for passwordless OTP login
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
    */

    // Generate new OTP for login
    const otp_code = generateOTP();
    const otp_expires_at = new Date(Date.now() + 10 * 60000);

    await User.updateOTP(user.id, otp_code, otp_expires_at);

    // Mock sending SMS
    console.log(`\n\n[MOCK SMS] To: ${phone_number} | Message: Your Somame API login verification code is: ${otp_code}\n\n`);

    res.status(200).json({
      status: 'success',
      message: 'Login initiated. OTP sent to phone number.',
      data: {
        userId: user.id,
        phone_number: user.phone_number
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and return JWT token
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res, next) => {
  try {
    const { phone_number, otp_code } = req.body;

    if (!phone_number || !otp_code) {
      return res.status(400).json({ status: 'error', message: 'Please provide phone number and OTP code' });
    }

    const result = await User.verifyOTP(phone_number, otp_code);

    if (!result.success) {
      return res.status(400).json({ status: 'error', message: result.message });
    }

    // Generate token since OTP is verified
    const token = jwt.sign({ id: result.user.id, role: result.user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully.',
      data: {
        user: {
          id: result.user.id,
          phone_number: result.user.phone_number,
          role: result.user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed the first admin user (HIDDEN ENDPOINT)
// @route   POST /api/auth/seed-admin
const seedAdmin = async (req, res, next) => {
  try {
    const { phone_number, password } = req.body;
    if (!phone_number || !password) {
      return res.status(400).json({ status: 'error', message: 'Provide phone_number and password' });
    }
    
    // Check if an admin already exists
    const adminCheck = await User.findByPhoneNumber(phone_number);
    if (adminCheck) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Force create verified admin
    const result = await User.create({ 
      phone_number, 
      password_hash, 
      role: 'admin', 
      otp_code: null, 
      otp_expires_at: null 
    });
    
    // Immediately verify
    await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [result.id]);

    res.status(201).json({ status: 'success', message: 'Admin seeded successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  seedAdmin
};
