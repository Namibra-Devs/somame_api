const { pool } = require('../config/db');

class SupportArticle {
  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM support_articles WHERE is_active = true ORDER BY category ASC, id ASC'
    );
    return result.rows;
  }

  static async findByCategory(category) {
    const result = await pool.query(
      'SELECT * FROM support_articles WHERE category = $1 AND is_active = true ORDER BY id ASC',
      [category]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM support_articles WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0];
  }

  static async getCategories() {
    const result = await pool.query(
      'SELECT DISTINCT category FROM support_articles WHERE is_active = true ORDER BY category ASC'
    );
    return result.rows.map(r => r.category);
  }
}

module.exports = SupportArticle;
