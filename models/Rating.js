const { pool } = require('../config/db');

class Rating {
  /**
   * Safely inserts vendor and/or rider ratings and updates their respective averages in a single transaction.
   * @param {Object} params
   * @param {number} params.orderId
   * @param {number} params.customerId
   * @param {number} params.vendorId
   * @param {number} [params.vendorRating]
   * @param {string} [params.vendorComment]
   * @param {number} [params.riderId]
   * @param {number} [params.riderRating]
   * @param {string} [params.riderComment]
   */
  static async submitRatings({
    orderId,
    customerId,
    vendorId,
    vendorRating,
    vendorComment,
    riderId,
    riderRating,
    riderComment
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Process Vendor Rating
      if (vendorRating) {
        await client.query(
          `INSERT INTO ratings (order_id, customer_id, target_id, target_type, rating, comment)
           VALUES ($1, $2, $3, 'vendor', $4, $5)
           ON CONFLICT (order_id, target_id, target_type) DO UPDATE 
           SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
          [orderId, customerId, vendorId, vendorRating, vendorComment]
        );

        // Calculate new average for vendor
        const vendorAvgResult = await client.query(
          `SELECT ROUND(AVG(rating), 2) as avg_rating 
           FROM ratings WHERE target_id = $1 AND target_type = 'vendor'`,
          [vendorId]
        );
        const vendorAvg = vendorAvgResult.rows[0].avg_rating || 0;

        // Update vendors table
        await client.query(
          `UPDATE vendors SET rating = $1 WHERE id = $2`,
          [vendorAvg, vendorId]
        );
      }

      // 2. Process Rider Rating
      if (riderRating && riderId) {
        await client.query(
          `INSERT INTO ratings (order_id, customer_id, target_id, target_type, rating, comment)
           VALUES ($1, $2, $3, 'rider', $4, $5)
           ON CONFLICT (order_id, target_id, target_type) DO UPDATE 
           SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
          [orderId, customerId, riderId, riderRating, riderComment]
        );

        // Calculate new average for rider
        const riderAvgResult = await client.query(
          `SELECT ROUND(AVG(rating), 2) as avg_rating 
           FROM ratings WHERE target_id = $1 AND target_type = 'rider'`,
          [riderId]
        );
        const riderAvg = riderAvgResult.rows[0].avg_rating || 0;

        // Update users table for the rider
        await client.query(
          `UPDATE users SET rating = $1 WHERE id = $2`,
          [riderAvg, riderId]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getRatingsByVendor(vendorId) {
    const result = await pool.query(
      `SELECT r.*, u.first_name, u.last_name 
       FROM ratings r
       JOIN users u ON r.customer_id = u.id
       WHERE r.target_id = $1 AND r.target_type = 'vendor'
       ORDER BY r.created_at DESC`,
      [vendorId]
    );
    return result.rows;
  }

  static async getRatingsByRider(riderId) {
    const result = await pool.query(
      `SELECT r.*, u.first_name, u.last_name 
       FROM ratings r
       JOIN users u ON r.customer_id = u.id
       WHERE r.target_id = $1 AND r.target_type = 'rider'
       ORDER BY r.created_at DESC`,
      [riderId]
    );
    return result.rows;
  }
}

module.exports = Rating;
