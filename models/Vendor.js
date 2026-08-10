const { pool } = require('../config/db');

class Vendor {
  static async findById(id) {
    const result = await pool.query(
      `SELECT id, user_id, category_id, name, logo_url, rating, tags, is_open, address,
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
      `SELECT id, user_id, category_id, name, logo_url, rating, tags, is_open, address,
              ST_Y(location::geometry) as lat, 
              ST_X(location::geometry) as lng, 
              created_at, updated_at 
       FROM vendors WHERE user_id = $1`,
      [user_id]
    );
    return result.rows[0];
  }

  static async create({ user_id, category_id = null, name, logo_url, rating = 0.00, tags, address, lat, lng }) {
    const result = await pool.query(
      `INSERT INTO vendors (user_id, category_id, name, logo_url, rating, tags, address, location) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326)) RETURNING *`,
      [user_id, category_id, name, logo_url, rating, tags, address, lng, lat]
    );
    return result.rows[0];
  }

  static async updateByUserId(user_id, { name, category_id, logo_url, tags, address, lat, lng, is_open }) {
    const result = await pool.query(
      `UPDATE vendors 
       SET name = COALESCE($1, name), 
           category_id = COALESCE($2, category_id), 
           logo_url = COALESCE($3, logo_url), 
           tags = COALESCE($4, tags),
           address = COALESCE($5, address),
           is_open = COALESCE($6, is_open),
           updated_at = CURRENT_TIMESTAMP,
           location = CASE 
                        WHEN $7::numeric IS NOT NULL AND $8::numeric IS NOT NULL 
                        THEN ST_SetSRID(ST_MakePoint($8, $7), 4326) 
                        ELSE location 
                      END
       WHERE user_id = $9 
       RETURNING id, user_id, category_id, name, logo_url, rating, tags, is_open, address, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng, created_at, updated_at`,
      [name, category_id, logo_url, tags, address, is_open, lat, lng, user_id]
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

  static async getDashboardStats(vendorId) {
    const cardsQuery = `
      SELECT status, COUNT(*) as count 
      FROM orders 
      WHERE vendor_id = $1 
      GROUP BY status
    `;
    const cardsResult = await pool.query(cardsQuery, [vendorId]);
    
    const recentOrdersQuery = `
      SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, u.first_name, u.last_name 
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.vendor_id = $1
      ORDER BY o.created_at DESC
      LIMIT 5
    `;
    const recentOrdersResult = await pool.query(recentOrdersQuery, [vendorId]);

    const salesQuery = `
      SELECT 
        EXTRACT(MONTH FROM created_at) as month,
        SUM(total_amount) as total_sales
      FROM orders
      WHERE vendor_id = $1 AND status = 'delivered' AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY month
      ORDER BY month
    `;
    const salesResult = await pool.query(salesQuery, [vendorId]);

    const topItemsQuery = `
      SELECT 
        m.id, 
        m.name, 
        m.image_url, 
        SUM(oi.quantity) as units_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN menu_items m ON oi.item_id = m.id
      WHERE o.vendor_id = $1 AND o.status = 'delivered'
      GROUP BY m.id, m.name, m.image_url
      ORDER BY units_sold DESC
      LIMIT 5
    `;
    const topItemsResult = await pool.query(topItemsQuery, [vendorId]);

    return {
      cards: cardsResult.rows,
      recentOrders: recentOrdersResult.rows,
      salesOverview: salesResult.rows,
      topItems: topItemsResult.rows
    };
  }

  static async getCustomers(vendorId, search = '', dateFilter = '', limit = 10, offset = 0) {
    let whereClause = 'WHERE o.vendor_id = $1';
    const params = [vendorId];
    let paramCount = 2;

    if (search) {
      whereClause += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.phone_number ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (dateFilter === 'today') {
      whereClause += ` AND DATE(o.created_at) = CURRENT_DATE`;
    } else if (dateFilter === 'yesterday') {
      whereClause += ` AND DATE(o.created_at) = CURRENT_DATE - INTERVAL '1 day'`;
    } else if (dateFilter === 'this_week') {
      whereClause += ` AND o.created_at >= date_trunc('week', CURRENT_DATE)`;
    } else if (dateFilter === 'this_month') {
      whereClause += ` AND o.created_at >= date_trunc('month', CURRENT_DATE)`;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) 
      FROM users u 
      JOIN orders o ON u.id = o.customer_id 
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get customers
    const query = `
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.phone_number,
        MAX(o.created_at) as last_order_date
      FROM users u
      JOIN orders o ON u.id = o.customer_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY last_order_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limit, offset);
    const result = await pool.query(query, params);

    return { totalCount, customers: result.rows };
  }

  static async getCustomerDetails(vendorId, customerId, limit = 10, offset = 0) {
    // Basic customer details & stats
    const statsQuery = `
      SELECT 
        u.id, u.first_name, u.last_name, u.phone_number, u.created_at as date_joined,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order,
        COALESCE(AVG(o.total_amount), 0) as average_order
      FROM users u
      LEFT JOIN orders o ON u.id = o.customer_id AND o.vendor_id = $1
      WHERE u.id = $2
      GROUP BY u.id
    `;
    const statsResult = await pool.query(statsQuery, [vendorId, customerId]);
    
    if (statsResult.rows.length === 0) {
      return null;
    }

    // Recent orders pagination
    const countQuery = `SELECT COUNT(*) FROM orders WHERE vendor_id = $1 AND customer_id = $2`;
    const countResult = await pool.query(countQuery, [vendorId, customerId]);
    const totalOrdersCount = parseInt(countResult.rows[0].count, 10);

    const ordersQuery = `
      SELECT id, order_number, status, total_amount, created_at, customer_note, estimated_delivery_time
      FROM orders
      WHERE vendor_id = $1 AND customer_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const ordersResult = await pool.query(ordersQuery, [vendorId, customerId, limit, offset]);

    return {
      stats: statsResult.rows[0],
      totalOrdersCount,
      recentOrders: ordersResult.rows
    };
  }
}

module.exports = Vendor;
