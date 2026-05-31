const { pool } = require('../config/db');

class Vendor {
  static async findById(id) {
    const result = await pool.query(
      `SELECT id, name, logo_url, rating, 
              ST_Y(location::geometry) as lat, 
              ST_X(location::geometry) as lng, 
              created_at 
       FROM vendors WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create({ user_id, name, logo_url, rating = 0.00, lat, lng }) {
    const result = await pool.query(
      `INSERT INTO vendors (user_id, name, logo_url, rating, location) 
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)) RETURNING *`,
      [user_id, name, logo_url, rating, lng, lat]
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
