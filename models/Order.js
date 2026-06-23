const { pool } = require('../config/db');

class Order {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByCustomerId(customerId) {
    const result = await pool.query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC', [customerId]);
    return result.rows;
  }

  static async findByVendorId(vendorId) {
    const result = await pool.query('SELECT * FROM orders WHERE vendor_id = $1 ORDER BY created_at DESC', [vendorId]);
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async assignRider(id, riderId) {
    const result = await pool.query(
      `UPDATE orders 
       SET rider_id = $1 
       WHERE id = $2 AND rider_id IS NULL 
       RETURNING *`,
      [riderId, id]
    );
    return result.rows[0];
  }

  static async getItemsByOrderId(orderId) {
    const result = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    return result.rows;
  }

  static async createWithItems({ order_number, customer_id, vendor_id, rider_id, status, total_amount, promotion_id, discount_amount, rider_tip, estimated_delivery_time, customer_note, payment_method, items, delivery_location }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        `INSERT INTO orders (order_number, customer_id, vendor_id, rider_id, status, total_amount, promotion_id, discount_amount, rider_tip, estimated_delivery_time, customer_note, payment_method) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [order_number, customer_id, vendor_id, rider_id || null, status || 'pending', total_amount, promotion_id || null, discount_amount || 0.00, rider_tip || 0.00, estimated_delivery_time || null, customer_note || null, payment_method]
      );
      const order = orderResult.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, item_id, item_name, quantity, price) VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.item_id || null, item.item_name, item.quantity, item.price]
        );
      }

      let delivery = null;
      if (rider_id && delivery_location) {
        const deliveryResult = await client.query(
          `INSERT INTO deliveries (order_id, rider_id, current_location) 
           VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)) RETURNING *`,
          [order.id, rider_id, delivery_location.lng, delivery_location.lat]
        );
        delivery = deliveryResult.rows[0];
      }

      await client.query('COMMIT');
      return { order, delivery };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Order;
