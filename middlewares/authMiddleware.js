const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Set user info on request
      req.user = decoded; // Contains id, role, etc.

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

module.exports = { protect };
