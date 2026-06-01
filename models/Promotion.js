const { pool } = require('../config/db');

class Promotion {
  static async create({ vendor_id, code, discount_type, discount_value, min_order_subtotal, max_discount_limit, applicable_to, expires_at, is_active }) {
    const appToJson = applicable_to ? JSON.stringify(applicable_to) : '{"type": "all", "ids": []}';
    const result = await pool.query(
      `INSERT INTO promotions (vendor_id, code, discount_type, discount_value, min_order_subtotal, max_discount_limit, applicable_to, expires_at, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [vendor_id, code.toUpperCase(), discount_type, discount_value, min_order_subtotal || 0, max_discount_limit, appToJson, expires_at, is_active ?? true]
    );
    return result.rows[0];
  }

  static async findByVendorId(vendor_id) {
    const result = await pool.query('SELECT * FROM promotions WHERE vendor_id = $1 ORDER BY created_at DESC', [vendor_id]);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM promotions WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByVendorAndCode(vendor_id, code) {
    const result = await pool.query(
      'SELECT * FROM promotions WHERE vendor_id = $1 AND code = $2',
      [vendor_id, code.toUpperCase()]
    );
    return result.rows[0];
  }

  static async update(id, vendor_id, { code, discount_type, discount_value, min_order_subtotal, max_discount_limit, applicable_to, expires_at, is_active }) {
    const appToJson = applicable_to ? JSON.stringify(applicable_to) : undefined;
    const upperCode = code ? code.toUpperCase() : undefined;
    
    const result = await pool.query(
      `UPDATE promotions 
       SET code = COALESCE($1, code),
           discount_type = COALESCE($2, discount_type), 
           discount_value = COALESCE($3, discount_value),
           min_order_subtotal = COALESCE($4, min_order_subtotal),
           max_discount_limit = COALESCE($5, max_discount_limit),
           applicable_to = COALESCE($6, applicable_to),
           expires_at = COALESCE($7, expires_at),
           is_active = COALESCE($8, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND vendor_id = $10
       RETURNING *`,
      [upperCode, discount_type, discount_value, min_order_subtotal, max_discount_limit, appToJson, expires_at, is_active, id, vendor_id]
    );
    return result.rows[0];
  }

  static async delete(id, vendor_id) {
    const result = await pool.query(
      'DELETE FROM promotions WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [id, vendor_id]
    );
    return result.rowCount > 0;
  }
}

module.exports = Promotion;
