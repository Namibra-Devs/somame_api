const { pool } = require('../config/db');

// In-memory cache for batching location updates to the database
// Format: { 'orderId': { riderId, lat, lng, timestamp } }
const locationBatchCache = {};

// Background worker to flush location updates to the database periodically
setInterval(async () => {
  const updates = Object.keys(locationBatchCache);
  if (updates.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const orderId of updates) {
      const data = locationBatchCache[orderId];

      // Update the deliveries table with the new current_location using PostGIS ST_MakePoint
      // Note: ST_MakePoint expects (longitude, latitude)
      await client.query(
        `UPDATE deliveries 
         SET current_location = ST_SetSRID(ST_MakePoint($1, $2), 4326), 
             updated_at = CURRENT_TIMESTAMP 
         WHERE order_id = $3 AND rider_id = $4`,
        [data.lng, data.lat, orderId, data.riderId]
      );

      // Record a point in the tracking_history table
      await client.query(
        `INSERT INTO tracking_history (delivery_id, location)
         SELECT id, ST_SetSRID(ST_MakePoint($1, $2), 4326)
         FROM deliveries WHERE order_id = $3 AND rider_id = $4`,
        [data.lng, data.lat, orderId, data.riderId]
      );

      // Remove from cache after successful update
      delete locationBatchCache[orderId];
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to flush location updates to DB:', error);
  } finally {
    client.release();
  }
}, 10000); // 10 seconds batching interval

/**
 * Attaches tracking events to the authenticated socket
 */
module.exports = (io, socket) => {

  // 1. Join Order Room
  socket.on('join_order_room', async (data) => {
    try {
      const { orderId } = data;
      if (!orderId) {
        socket.emit('error', { message: 'orderId is required' });
        return;
      }

      // Validate authorization against the database
      const orderResult = await pool.query(
        'SELECT customer_id, vendor_id, rider_id FROM orders WHERE id = $1',
        [orderId]
      );

      const order = orderResult.rows[0];
      if (!order) {
        socket.emit('error', { message: 'Order not found' });
        return;
      }

      const { id: userId, role } = socket.user;

      // Customer can join if they own the order
      // Vendor can join if the order belongs to them
      // Rider can join if they are assigned to the order
      const isAuthorized =
        (role === 'customer' && order.customer_id === userId) ||
        (role === 'vendor' && order.vendor_id === userId) ||
        (role === 'rider' && order.rider_id === userId);

      if (isAuthorized) {
        socket.join(`order_${orderId}`);
        socket.emit('room_joined', { orderId, message: 'Successfully joined tracking room' });
      } else {
        socket.emit('error', { message: 'Unauthorized to join this order room, admin roles are not allowed and also you should be the owner of the order' });
      }
    } catch (error) {
      console.error('Error in join_order_room:', error);
      socket.emit('error', { message: 'Internal server error' });
    }
  });

  // 2. Update Location
  socket.on('update_location', (data) => {
    const { orderId, latitude, longitude } = data;

    if (!orderId || !latitude || !longitude) {
      socket.emit('error', { message: 'orderId, latitude, and longitude are required' });
      return;
    }

    // Ensure only the assigned rider can broadcast updates
    if (socket.user.role !== 'rider') {
      socket.emit('error', { message: 'Only riders can update location' });
      return;
    }

    // Broadcast live to everyone in the room (e.g. Customers, Vendors)
    io.to(`order_${orderId}`).emit('location_changed', {
      orderId,
      riderId: socket.user.id,
      latitude,
      longitude,
      timestamp: new Date()
    });

    // Save to in-memory batch cache to optimize database writes
    locationBatchCache[orderId] = {
      riderId: socket.user.id,
      lat: latitude,
      lng: longitude,
      timestamp: new Date()
    };
  });
};
