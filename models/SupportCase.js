const { pool } = require('../config/db');

class SupportCase {
  static async create({ case_number, user_id, order_id = null, parcel_order_id = null, subject = null, status = 'open', priority = 'medium', last_message = null }) {
    const query = `
      INSERT INTO support_cases (case_number, user_id, order_id, parcel_order_id, subject, status, priority, last_message, last_message_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const values = [case_number, user_id, order_id, parcel_order_id, subject, status, priority, last_message];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT sc.*, 
             o.order_number, 
             o.total_amount as order_total,
             o.status as order_status,
             o.created_at as order_created_at,
             v.name as vendor_name, 
             v.logo_url as vendor_logo,
             po.order_number as parcel_order_number
      FROM support_cases sc
      LEFT JOIN orders o ON sc.order_id = o.id
      LEFT JOIN vendors v ON o.vendor_id = v.id
      LEFT JOIN parcel_orders po ON sc.parcel_order_id = po.id
      WHERE sc.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByCaseNumber(case_number) {
    const query = `
      SELECT sc.*, 
             o.order_number, 
             o.total_amount as order_total,
             o.status as order_status,
             o.created_at as order_created_at,
             v.name as vendor_name, 
             v.logo_url as vendor_logo,
             po.order_number as parcel_order_number
      FROM support_cases sc
      LEFT JOIN orders o ON sc.order_id = o.id
      LEFT JOIN vendors v ON o.vendor_id = v.id
      LEFT JOIN parcel_orders po ON sc.parcel_order_id = po.id
      WHERE sc.case_number = $1;
    `;
    const result = await pool.query(query, [case_number]);
    return result.rows[0];
  }

  static async findByIdOrCaseNumber(identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).replace(/^Case\s*/i, '').trim();

    // 1. Try finding by case_number first
    let supportCase = await this.findByCaseNumber(cleanId);
    if (supportCase) return supportCase;

    // 2. If not found and fits within a standard 32-bit integer, try by primary key id
    const num = Number(cleanId);
    if (!isNaN(num) && Number.isInteger(num) && num > 0 && num <= 2147483647) {
      supportCase = await this.findById(num);
    }

    return supportCase;
  }

  static async findByUserId(user_id, options = {}) {
    let limit = null;
    let status = null;
    if (typeof options === 'number') {
      limit = options;
    } else if (options && typeof options === 'object') {
      limit = options.limit || null;
      status = options.status || null;
    }

    let query = `
      SELECT sc.*, 
             o.order_number, 
             o.total_amount as order_total,
             o.status as order_status,
             v.name as vendor_name, 
             v.logo_url as vendor_logo,
             po.order_number as parcel_order_number
      FROM support_cases sc
      LEFT JOIN orders o ON sc.order_id = o.id
      LEFT JOIN vendors v ON o.vendor_id = v.id
      LEFT JOIN parcel_orders po ON sc.parcel_order_id = po.id
      WHERE sc.user_id = $1
    `;
    const values = [user_id];
    let paramIndex = 2;

    if (status) {
      const lower = status.toLowerCase();
      if (lower === 'open') {
        query += ` AND sc.status IN ('open', 'in_progress')`;
      } else if (lower === 'closed') {
        query += ` AND sc.status IN ('closed', 'resolved')`;
      } else if (lower !== 'all') {
        query += ` AND sc.status = $${paramIndex}`;
        values.push(lower);
        paramIndex++;
      }
    }

    query += ` ORDER BY sc.last_message_at DESC`;

    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getCountsByUserId(user_id) {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')) as open_count,
        COUNT(*) FILTER (WHERE status IN ('closed', 'resolved')) as closed_count,
        COUNT(*) as total_count
      FROM support_cases
      WHERE user_id = $1;
    `;
    const result = await pool.query(query, [user_id]);
    const row = result.rows[0];
    return {
      open: parseInt(row.open_count, 10) || 0,
      closed: parseInt(row.closed_count, 10) || 0,
      total: parseInt(row.total_count, 10) || 0
    };
  }

  static async findOpenByOrderId(order_id, user_id) {
    const query = `
      SELECT sc.*, 
             v.name as vendor_name, 
             v.logo_url as vendor_logo
      FROM support_cases sc
      LEFT JOIN orders o ON sc.order_id = o.id
      LEFT JOIN vendors v ON o.vendor_id = v.id
      WHERE sc.order_id = $1 AND sc.user_id = $2 AND sc.status IN ('open', 'in_progress')
      ORDER BY sc.created_at DESC
      LIMIT 1;
    `;
    const result = await pool.query(query, [order_id, user_id]);
    return result.rows[0];
  }

  static async updateLastMessage(id, message) {
    const query = `
      UPDATE support_cases 
      SET last_message = $1, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [message, id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE support_cases 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }
}

module.exports = SupportCase;
