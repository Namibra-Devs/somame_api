const { pool } = require('../config/db');

class JobDecline {
  static async recordDecline(order_number, rider_id) {
    const result = await pool.query(
      `INSERT INTO job_declines (order_number, rider_id) 
       VALUES ($1, $2) 
       ON CONFLICT (order_number, rider_id) DO NOTHING 
       RETURNING *`,
      [order_number, rider_id]
    );
    return result.rows[0];
  }

  static async hasDeclined(order_number, rider_id) {
    const result = await pool.query(
      `SELECT id FROM job_declines WHERE order_number = $1 AND rider_id = $2`,
      [order_number, rider_id]
    );
    return result.rowCount > 0;
  }
}

module.exports = JobDecline;
