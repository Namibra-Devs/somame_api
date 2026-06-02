const { pool } = require('../config/db');

// In-memory cache for batching location updates to the database
// Format: { 'food_1': { orderId, orderType: 'food', riderId, lat, lng, timestamp } }
const locationBatchCache = {};

// Background worker to flush location updates to the database periodically
setInterval(async () => {
  const updates = Object.keys(locationBatchCache);
  if (updates.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const key of updates) {
      const data = locationBatchCache[key];

      if (data.orderType === 'food') {
        await client.query(
          `UPDATE deliveries 
           SET current_location = ST_SetSRID(ST_MakePoint($1, $2), 4326), 
               updated_at = CURRENT_TIMESTAMP 
           WHERE order_id = $3 AND rider_id = $4`,
          [data.lng, data.lat, data.orderId, data.riderId]
        );

        await client.query(
          `INSERT INTO tracking_history (delivery_id, location)
           SELECT id, ST_SetSRID(ST_MakePoint($1, $2), 4326)
           FROM deliveries WHERE order_id = $3 AND rider_id = $4`,
          [data.lng, data.lat, data.orderId, data.riderId]
        );
      } else if (data.orderType === 'parcel') {
        await client.query(
          `UPDATE parcel_deliveries 
           SET current_location = ST_SetSRID(ST_MakePoint($1, $2), 4326), 
               updated_at = CURRENT_TIMESTAMP 
           WHERE parcel_order_id = $3 AND rider_id = $4`,
          [data.lng, data.lat, data.orderId, data.riderId]
        );

        await client.query(
          `INSERT INTO parcel_tracking_history (parcel_delivery_id, location)
           SELECT id, ST_SetSRID(ST_MakePoint($1, $2), 4326)
           FROM parcel_deliveries WHERE parcel_order_id = $3 AND rider_id = $4`,
          [data.lng, data.lat, data.orderId, data.riderId]
        );
      }

      delete locationBatchCache[key];
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to flush location updates to DB:', error);
  } finally {
    client.release();
  }
}, 10000); // 10 seconds batching interval

module.exports = (io, socket) => {

  // 1. Join Order Room
  socket.on('join_order_room', async (data) => {
    try {
      const { orderId, orderType = 'food' } = data;
      if (!orderId) {
        socket.emit('error', { message: 'orderId is required' });
        return;
      }

      const { id: userId, role } = socket.user;
      let isAuthorized = false;

      if (orderType === 'food') {
        const orderResult = await pool.query(
          'SELECT customer_id, vendor_id, rider_id FROM orders WHERE id = $1',
          [orderId]
        );
        const order = orderResult.rows[0];
        if (!order) {
          socket.emit('error', { message: 'Food order not found' });
          return;
        }
        isAuthorized =
          (role === 'customer' && order.customer_id === userId) ||
          (role === 'vendor' && order.vendor_id === userId) ||
          (role === 'rider' && order.rider_id === userId);
      } else if (orderType === 'parcel') {
        const parcelResult = await pool.query(
          'SELECT customer_id, rider_id FROM parcel_orders WHERE id = $1',
          [orderId]
        );
        const parcel = parcelResult.rows[0];
        if (!parcel) {
          socket.emit('error', { message: 'Parcel order not found' });
          return;
        }
        isAuthorized =
          (role === 'customer' && parcel.customer_id === userId) ||
          (role === 'rider' && parcel.rider_id === userId);
      }

      if (isAuthorized) {
        socket.join(`${orderType}_${orderId}`);
        socket.emit('room_joined', { orderId, orderType, message: 'Successfully joined tracking room' });
      } else {
        socket.emit('error', { message: 'Unauthorized to join this tracking room' });
      }
    } catch (error) {
      console.error('Error in join_order_room:', error);
      socket.emit('error', { message: 'Internal server error' });
    }
  });

  // 2. Update Location
  socket.on('update_location', (data) => {
    const { orderId, orderType = 'food', latitude, longitude } = data;

    if (!orderId || !latitude || !longitude) {
      socket.emit('error', { message: 'orderId, latitude, and longitude are required' });
      return;
    }

    if (socket.user.role !== 'rider') {
      socket.emit('error', { message: 'Only riders can update location' });
      return;
    }

    io.to(`${orderType}_${orderId}`).emit('location_changed', {
      orderId,
      orderType,
      riderId: socket.user.id,
      latitude,
      longitude,
      timestamp: new Date()
    });

    const cacheKey = `${orderType}_${orderId}`;
    locationBatchCache[cacheKey] = {
      orderId,
      orderType,
      riderId: socket.user.id,
      lat: latitude,
      lng: longitude,
      timestamp: new Date()
    };
  });
};
