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
}

module.exports = Delivery;
