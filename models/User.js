const { pool } = require('../config/db');

class User {
  static async findByPhoneNumber(phone_number) {
    const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT id, phone_number, role, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ phone_number, password_hash, role }) {
    const result = await pool.query(
      'INSERT INTO users (phone_number, password_hash, role) VALUES ($1, $2, $3) RETURNING id, phone_number, role, created_at',
      [phone_number, password_hash, role]
    );
    return result.rows[0];
  }
}

module.exports = User;
