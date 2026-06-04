const { pool } = require('../config/db');

class User {
  static async findByPhoneNumber(phone_number) {
    const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT id, phone_number, role, is_verified, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ phone_number, password_hash, role, otp_code, otp_expires_at }) {
    const result = await pool.query(
      'INSERT INTO users (phone_number, password_hash, role, is_verified, otp_code, otp_expires_at) VALUES ($1, $2, $3, false, $4, $5) RETURNING id, phone_number, role, is_verified, created_at',
      [phone_number, password_hash, role, otp_code, otp_expires_at]
    );
    return result.rows[0];
  }

  static async updateOTP(id, otp_code, otp_expires_at) {
    const result = await pool.query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3 RETURNING id, phone_number',
      [otp_code, otp_expires_at, id]
    );
    return result.rows[0];
  }

  static async verifyOTP(phone_number, otp_code) {
    // Check if the user has a matching, unexpired OTP
    const userResult = await pool.query(
      'SELECT id, role, otp_code, otp_expires_at FROM users WHERE phone_number = $1',
      [phone_number]
    );
    const user = userResult.rows[0];
    
    if (!user) return { success: false, message: 'User not found' };
    if (user.otp_code !== String(otp_code)) return { success: false, message: 'Invalid OTP' };
    if (new Date() > new Date(user.otp_expires_at)) return { success: false, message: 'OTP expired' };

    // Clear OTP and set verified
    const result = await pool.query(
      'UPDATE users SET is_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE id = $1 RETURNING id, phone_number, role',
      [user.id]
    );

    return { success: true, user: result.rows[0] };
  }
}

module.exports = User;
