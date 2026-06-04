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

    // 3. Subscribing to specific order updates (e.g. customer tracking an order)
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`User ${socket.user.id} joined tracking room for order_${orderId}`);
    });

    // 4. Real-time location updates from riders
    socket.on('update_location', (data) => {
      // Expecting data: { orderId: 123, location: { lat: 5.6037, lng: -0.1870 } }
      if (data.orderId && data.location) {
        // Broadcast to anyone tracking this specific order
        io.to(`order_${data.orderId}`).emit('rider_location_updated', {
          orderId: data.orderId,
          riderId: socket.user.id,
          location: data.location,
          timestamp: new Date()
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.user.id} | Reason: ${reason}`);
    });
  });
};

module.exports = socketManager;
