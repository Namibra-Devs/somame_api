const { pool } = require('../config/db');

class Category {
  static async findAll() {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ name, description }) {
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return result.rows[0];
  }

  static async update(id, { name, description, is_active }) {
    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, description, is_active, id]
    );
    return result.rows[0];
  }

  static async patch(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return null;

    const setString = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(fields);
    values.push(id);

    const query = `UPDATE categories SET ${setString}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }
}

module.exports = Category;
