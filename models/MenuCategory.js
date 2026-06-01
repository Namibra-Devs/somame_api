const { pool } = require('../config/db');

class MenuCategory {
  static async create({ vendor_id, name, description }) {
    const result = await pool.query(
      'INSERT INTO menu_categories (vendor_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [vendor_id, name, description]
    );
    return result.rows[0];
  }

  static async findByVendorId(vendor_id) {
    const result = await pool.query(
      'SELECT * FROM menu_categories WHERE vendor_id = $1 ORDER BY name ASC',
      [vendor_id]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM menu_categories WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async update(id, vendor_id, { name, description }) {
    const result = await pool.query(
      `UPDATE menu_categories 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND vendor_id = $4
       RETURNING *`,
      [name, description, id, vendor_id]
    );
    return result.rows[0];
  }

  static async delete(id, vendor_id) {
    const result = await pool.query(
      'DELETE FROM menu_categories WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [id, vendor_id]
    );
    return result.rowCount > 0;
  }
}

module.exports = MenuCategory;
