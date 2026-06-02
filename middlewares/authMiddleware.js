const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Look up user in DB to ensure they still exist and are active
      const userResult = await pool.query('SELECT id, role, is_active FROM users WHERE id = $1', [decoded.id]);
      const user = userResult.rows[0];

      if (!user) {
        return res.status(401).json({ status: 'error', message: 'Not authorized, user no longer exists' });
      }

      if (!user.is_active) {
        return res.status(403).json({ status: 'error', message: 'Account has been disabled. Please contact support.' });
      }

      // Set user info on request
      req.user = user; // Contains id, role, is_active

      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ status: 'error', message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
