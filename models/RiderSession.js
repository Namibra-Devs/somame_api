const { pool } = require('../config/db');

class RiderSession {
  static async startSession(riderId) {
    const result = await pool.query(
      `INSERT INTO rider_sessions (rider_id, online_at)
       VALUES ($1, CURRENT_TIMESTAMP)
       RETURNING *`,
      [riderId]
    );
    return result.rows[0];
  }

  static async endSession(riderId) {
    // Find the latest active session (no offline_at)
    const activeSessionResult = await pool.query(
      `SELECT * FROM rider_sessions 
       WHERE rider_id = $1 AND offline_at IS NULL 
       ORDER BY online_at DESC LIMIT 1`,
      [riderId]
    );

    if (activeSessionResult.rows.length > 0) {
      const sessionId = activeSessionResult.rows[0].id;
      const result = await pool.query(
        `UPDATE rider_sessions 
         SET offline_at = CURRENT_TIMESTAMP,
             duration_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - online_at)) / 60
         WHERE id = $1
         RETURNING *`,
        [sessionId]
      );
      return result.rows[0];
    }
    return null;
  }

  static async getTodayOnlineMinutes(riderId) {
    // Get total duration of completed sessions today
    const completedResult = await pool.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes
       FROM rider_sessions
       WHERE rider_id = $1 AND DATE(online_at) = CURRENT_DATE AND offline_at IS NOT NULL`,
      [riderId]
    );

    let totalMinutes = parseInt(completedResult.rows[0].total_minutes, 10);

    // Add duration of current active session (if any)
    const activeSessionResult = await pool.query(
      `SELECT COALESCE(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - online_at)) / 60, 0) as current_minutes
       FROM rider_sessions
       WHERE rider_id = $1 AND DATE(online_at) = CURRENT_DATE AND offline_at IS NULL
       ORDER BY online_at DESC LIMIT 1`,
      [riderId]
    );

    if (activeSessionResult.rows.length > 0) {
      totalMinutes += parseInt(activeSessionResult.rows[0].current_minutes, 10);
    }

    return totalMinutes;
  }
}

module.exports = RiderSession;
