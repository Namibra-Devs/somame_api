const { pool } = require('../config/db');

class Vendor {
  static async findById(id) {
    const result = await pool.query(
      `SELECT id, user_id, category_id, name, logo_url, rating, 
              ST_Y(location::geometry) as lat, 
              ST_X(location::geometry) as lng, 
              created_at 
       FROM vendors WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(user_id) {
    const result = await pool.query(
      `SELECT id, user_id, category_id, name, logo_url, rating, 
              ST_Y(location::geometry) as lat, 
              ST_X(location::geometry) as lng, 
              created_at 
       FROM vendors WHERE user_id = $1`,
      [user_id]
    );
    return result.rows[0];
  }

  static async create({ user_id, category_id = null, name, logo_url, rating = 0.00, lat, lng }) {
    const result = await pool.query(
      `INSERT INTO vendors (user_id, category_id, name, logo_url, rating, location) 
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326)) RETURNING *`,
      [user_id, category_id, name, logo_url, rating, lng, lat]
    );
    return result.rows[0];
  }

  static async updateByUserId(user_id, { name, category_id, logo_url, lat, lng }) {
    const result = await pool.query(
      `UPDATE vendors 
       SET name = COALESCE($1, name), 
           category_id = COALESCE($2, category_id), 
           logo_url = COALESCE($3, logo_url), 
           location = CASE 
                        WHEN $4::numeric IS NOT NULL AND $5::numeric IS NOT NULL 
                        THEN ST_SetSRID(ST_MakePoint($5, $4), 4326) 
                        ELSE location 
                      END
       WHERE user_id = $6 
       RETURNING id, user_id, category_id, name, logo_url, rating, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng, created_at`,
      [name, category_id, logo_url, lat, lng, user_id]
    );
    return result.rows[0];
  }

  static async getNearby(lat, lng, radius) {
    const query = `
      SELECT id, name, logo_url, rating, 
             ST_Y(location::geometry) as lat, 
             ST_X(location::geometry) as lng,
             ST_DistanceSphere(location::geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance
      FROM vendors
      WHERE ST_DistanceSphere(location::geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)) <= $3
      ORDER BY distance ASC;
    `;
    const result = await pool.query(query, [lng, lat, radius]);
    return result.rows;
  }
}

module.exports = Vendor;
