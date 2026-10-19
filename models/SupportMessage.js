const { pool } = require('../config/db');

class SupportMessage {
  static async create({ case_id, sender_id = null, sender_type = 'customer', message, attachments = [] }) {
    const query = `
      INSERT INTO support_messages (case_id, sender_id, sender_type, message, attachments)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [case_id, sender_id, sender_type, message, JSON.stringify(attachments)];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByCaseId(case_id) {
    const query = `
      SELECT sm.*,
             u.first_name as sender_first_name,
             u.last_name as sender_last_name,
             u.profile_picture as sender_profile_picture
      FROM support_messages sm
      LEFT JOIN users u ON sm.sender_id = u.id
      WHERE sm.case_id = $1
      ORDER BY sm.created_at ASC;
    `;
    const result = await pool.query(query, [case_id]);
    return result.rows;
  }

  static async markAsRead(case_id, excludeSenderId = null) {
    let query = `UPDATE support_messages SET is_read = true WHERE case_id = $1`;
    const values = [case_id];
    if (excludeSenderId) {
      query += ` AND (sender_id != $2 OR sender_id IS NULL)`;
      values.push(excludeSenderId);
    }
    await pool.query(query, values);
  }
}

module.exports = SupportMessage;
