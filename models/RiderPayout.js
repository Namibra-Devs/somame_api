const { pool } = require('../config/db');

class RiderPayout {
  static async create(payoutData, client = pool) {
    const {
      rider_id,
      amount,
      payment_method_id,
      payout_method_name,
      payout_account_info
    } = payoutData;

    const result = await client.query(
      `INSERT INTO rider_payouts 
       (rider_id, amount, payment_method_id, payout_method_name, payout_account_info, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [rider_id, amount, payment_method_id, payout_method_name, payout_account_info]
    );

    return result.rows[0];
  }

  static async findByRiderId(riderId) {
    const result = await pool.query(
      `SELECT * FROM rider_payouts WHERE rider_id = $1 ORDER BY created_at DESC`,
      [riderId]
    );
    return result.rows;
  }

  static async updateStatus(id, status, client = pool) {
    const result = await client.query(
      `UPDATE rider_payouts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }
}

module.exports = RiderPayout;
