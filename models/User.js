const { pool } = require('../config/db');

class User {
  static async findByPhoneNumber(phone_number) {
    const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT id, first_name, last_name, email, phone_number, role, is_verified, is_active, created_at, updated_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async getAuthDataById(id) {
    const result = await pool.query('SELECT id, password_hash, is_active FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async updateProfile(id, { first_name, last_name, email }) {
    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name), 
           last_name = COALESCE($2, last_name), 
           email = COALESCE($3, email),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING id, first_name, last_name, email, phone_number, role, is_verified, is_active, updated_at`,
      [first_name, last_name, email, id]
    );
    return result.rows[0];
  }

  static async updatePassword(id, new_password_hash) {
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [new_password_hash, id]
    );
    return result.rowCount > 0;
  }

  static async updateUserStatus(id, is_active) {
    const result = await pool.query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, phone_number, is_active',
      [is_active, id]
    );
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
      'SELECT id, role, is_active, otp_code, otp_expires_at FROM users WHERE phone_number = $1',
      [phone_number]
    );
    const user = userResult.rows[0];
    
    if (!user) return { success: false, message: 'User not found' };
    if (!user.is_active) return { success: false, message: 'Account has been disabled. Please contact support.' };
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
