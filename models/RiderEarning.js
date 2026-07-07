const { pool } = require('../config/db');

class RiderEarning {
  static async create(earningData, client = pool) {
    const {
      rider_id,
      order_id,
      parcel_order_id,
      earning_type,
      base_pay,
      distance_bonus,
      tip,
      amount
    } = earningData;

    const result = await client.query(
      `INSERT INTO rider_earnings 
       (rider_id, order_id, parcel_order_id, earning_type, base_pay, distance_bonus, tip, amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [rider_id, order_id, parcel_order_id, earning_type, base_pay || 0, distance_bonus || 0, tip || 0, amount]
    );

    return result.rows[0];
  }

  static async getWeeklyBreakdown(riderId) {
    // Get stats for the current week (Monday to Sunday)
    const result = await pool.query(
      `
      WITH daily_stats AS (
        SELECT 
          EXTRACT(ISODOW FROM created_at) as day_of_week,
          SUM(amount) as total_amount,
          SUM(base_pay) as total_base_pay,
          SUM(distance_bonus) as total_distance_bonus,
          SUM(tip) as total_tip,
          SUM(CASE WHEN earning_type = 'streak_bonus' THEN amount ELSE 0 END) as total_streak_bonus
        FROM rider_earnings
        WHERE rider_id = $1 
          AND created_at >= date_trunc('week', CURRENT_DATE)
        GROUP BY day_of_week
      )
      SELECT * FROM daily_stats
      `,
      [riderId]
    );
    return result.rows;
  }

  static async getTodayEarnings(riderId) {
    const result = await pool.query(
      `
      SELECT 
        COALESCE(SUM(amount), 0) as today_total 
      FROM rider_earnings 
      WHERE rider_id = $1 
        AND created_at >= date_trunc('day', CURRENT_DATE)
      `,
      [riderId]
    );
    return result.rows[0].today_total;
  }

  static async getYesterdayEarnings(riderId) {
    const result = await pool.query(
      `
      SELECT 
        COALESCE(SUM(amount), 0) as yesterday_total 
      FROM rider_earnings 
      WHERE rider_id = $1 
        AND created_at >= date_trunc('day', CURRENT_DATE - INTERVAL '1 day')
        AND created_at < date_trunc('day', CURRENT_DATE)
      `,
      [riderId]
    );
    return result.rows[0].yesterday_total;
  }
}

module.exports = RiderEarning;
