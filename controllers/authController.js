const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { phone_number, password, role } = req.body;
    
    // Basic validation
    if (!phone_number || !password || !role) {
      return res.status(400).json({ status: 'error', message: 'Please provide all required fields' });
    }

    // Validate role
    if (!['customer', 'rider', 'vendor'].includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Invalid role specified' });
    }

    // Check if user exists
    const userExists = await User.findByPhoneNumber(phone_number);
    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'User with this phone number already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({ phone_number, password_hash, role });

    // Generate token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({
      status: 'success',
      data: {
        user,
        token
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
    const { phone_number, password } = req.body;

    // Validation
    if (!phone_number || !password) {
      return res.status(400).json({ status: 'error', message: 'Please provide phone number and password' });
    }

    // Check user
    const user = await User.findByPhoneNumber(phone_number);

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          phone_number: user.phone_number,
          role: user.role,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login
};
