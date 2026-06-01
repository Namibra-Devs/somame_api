const { pool } = require('../config/db');

class MenuItem {
  static async create({ vendor_id, menu_category_id, name, description, price, size, quantity, image_url, extras, is_in_stock }) {
    const extrasJson = extras ? JSON.stringify(extras) : '[]';
    const result = await pool.query(
      `INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, image_url, extras, is_in_stock) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [vendor_id, menu_category_id, name, description, price, size, quantity, image_url, extrasJson, is_in_stock ?? true]
    );
    return result.rows[0];
  }

  static async findByVendorId(vendor_id, category_id = null) {
    let query = 'SELECT * FROM menu_items WHERE vendor_id = $1';
    const params = [vendor_id];

    if (category_id) {
      query += ' AND menu_category_id = $2';
      params.push(category_id);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async update(id, vendor_id, { menu_category_id, name, description, price, size, quantity, image_url, extras, is_in_stock }) {
    const extrasJson = extras ? JSON.stringify(extras) : undefined;
    
    // We only update provided fields using COALESCE
    const result = await pool.query(
      `UPDATE menu_items 
       SET menu_category_id = COALESCE($1, menu_category_id),
           name = COALESCE($2, name), 
           description = COALESCE($3, description),
           price = COALESCE($4, price),
           size = COALESCE($5, size),
           quantity = COALESCE($6, quantity),
           image_url = COALESCE($7, image_url),
           extras = COALESCE($8, extras),
           is_in_stock = COALESCE($9, is_in_stock),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND vendor_id = $11
       RETURNING *`,
      [menu_category_id, name, description, price, size, quantity, image_url, extrasJson, is_in_stock, id, vendor_id]
    );
    return result.rows[0];
  }

  static async delete(id, vendor_id) {
    const result = await pool.query(
      'DELETE FROM menu_items WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [id, vendor_id]
    );
    return result.rowCount > 0;
  }
}

module.exports = MenuItem;
