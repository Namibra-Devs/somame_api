const socketAuth = require('../middlewares/socketAuth');

const socketManager = (io) => {
  // Apply the JWT authentication middleware to all incoming socket connections
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} | Role: ${socket.user.role} | Socket ID: ${socket.id}`);

    // 1. Join a personal room for private notifications
    socket.join(`user_${socket.user.id}`);

    // 2. Role-based grouping for broadcast events
    if (socket.user.role === 'rider') {
      socket.join('riders');
    } else if (socket.user.role === 'vendor') {
      socket.join(`vendor_${socket.user.vendor_id || socket.user.id}`);
    }

    // Attach modularized tracking event handlers
    require('./trackingSocket')(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.user.id} | Reason: ${reason}`);
    });
  });
};

module.exports = socketManager;
