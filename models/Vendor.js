const { pool } = require('../config/db');

class Vendor {
  static async findById(id) {
    const result = await pool.query(
      `SELECT id, user_id, category_id, name, logo_url, rating, tags, is_open,
              ST_Y(location::geometry) as lat, 
              ST_X(location::geometry) as lng, 
              created_at, updated_at 
       FROM vendors WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(user_id) {
    const result = await pool.query(
      `SELECT id, user_id, category_id, name, logo_url, rating, tags, is_open,
              ST_Y(location::geometry) as lat, 
              ST_X(location::geometry) as lng, 
              created_at, updated_at 
       FROM vendors WHERE user_id = $1`,
      [user_id]
    );
    return result.rows[0];
  }

  static async create({ user_id, category_id = null, name, logo_url, rating = 0.00, tags, lat, lng }) {
    const result = await pool.query(
      `INSERT INTO vendors (user_id, category_id, name, logo_url, rating, tags, location) 
       VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326)) RETURNING *`,
      [user_id, category_id, name, logo_url, rating, tags, lng, lat]
    );
    return result.rows[0];
  }

  static async updateByUserId(user_id, { name, category_id, logo_url, tags, lat, lng, is_open }) {
    const result = await pool.query(
      `UPDATE vendors 
       SET name = COALESCE($1, name), 
           category_id = COALESCE($2, category_id), 
           logo_url = COALESCE($3, logo_url), 
           tags = COALESCE($4, tags),
           is_open = COALESCE($5, is_open),
           updated_at = CURRENT_TIMESTAMP,
           location = CASE 
                        WHEN $6::numeric IS NOT NULL AND $7::numeric IS NOT NULL 
                        THEN ST_SetSRID(ST_MakePoint($7, $6), 4326) 
                        ELSE location 
                      END
       WHERE user_id = $8 
       RETURNING id, user_id, category_id, name, logo_url, rating, tags, is_open, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng, created_at, updated_at`,
      [name, category_id, logo_url, tags, is_open, lat, lng, user_id]
    );
    return result.rows[0];
  }

  static async getNearby(lat, lng, radius) {
    const query = `
      SELECT id, name, logo_url, rating, is_open,
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

  static async search({ q, is_open, category_id, lat, lng, radius = 5000, sort }) {
    let query = `
      SELECT v.id, v.name, v.logo_url, v.rating, v.is_open,
             ST_Y(v.location::geometry) as lat, 
             ST_X(v.location::geometry) as lng`;
    
    const queryParams = [];
    let paramIndex = 1;
    const whereClauses = [];

    if (lat && lng) {
      query += `, ST_DistanceSphere(v.location::geometry, ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex+1}), 4326)) as distance`;
      whereClauses.push(`ST_DistanceSphere(v.location::geometry, ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex+1}), 4326)) <= $${paramIndex+2}`);
      queryParams.push(lng, lat, radius);
      paramIndex += 3;
    }

    query += ` FROM vendors v LEFT JOIN categories c ON v.category_id = c.id`;

    if (q) {
      whereClauses.push(`(v.name ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`);
      queryParams.push(`%${q}%`);
      paramIndex++;
    }

    if (is_open !== undefined) {
      whereClauses.push(`v.is_open = $${paramIndex}`);
      queryParams.push(is_open === 'true' || is_open === true);
      paramIndex++;
    }

    if (category_id) {
      whereClauses.push(`v.category_id = $${paramIndex}`);
      queryParams.push(category_id);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ` + whereClauses.join(' AND ');
    }

    if (sort === 'rating') {
      query += ` ORDER BY v.rating DESC`;
    } else if (lat && lng) {
      query += ` ORDER BY distance ASC`;
    } else {
      query += ` ORDER BY v.name ASC`;
    }

    const result = await pool.query(query, queryParams);
    return result.rows;
  }
}

module.exports = Vendor;
