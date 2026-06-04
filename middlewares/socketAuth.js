const jwt = require('jsonwebtoken');

const socketAuth = (socket, next) => {
  try {
    // Clients can pass tokens via auth object or connection headers
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded user info (id, role, etc.) to the socket instance
    socket.user = decoded;
    
    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid or expired token'));
  }
};

module.exports = socketAuth;
