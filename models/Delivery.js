const { pool } = require('../config/db');

class Delivery {
  static async findByOrderId(orderId) {
    const result = await pool.query(
      `SELECT id, rider_id, updated_at, 
              ST_Y(current_location::geometry) as lat, 
              ST_X(current_location::geometry) as lng 
       FROM deliveries WHERE order_id = $1`, 
      [orderId]
    );
    return result.rows[0];
  }

  static async create(orderId, riderId, lat, lng) {
    const result = await pool.query(
      `INSERT INTO deliveries (order_id, rider_id, current_location) 
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)) 
       ON CONFLICT (order_id) DO UPDATE SET rider_id = EXCLUDED.rider_id, current_location = EXCLUDED.current_location
       RETURNING *`,
      [orderId, riderId, lng, lat]
    );
    return result.rows[0];
  }
}

module.exports = Delivery;
