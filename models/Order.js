const { pool } = require('../config/db');

class Order {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async getItemsByOrderId(orderId) {
    const result = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    return result.rows;
  }

  static async createWithItems({ customer_id, vendor_id, rider_id, status, total_amount, payment_method, items, delivery_location }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        `INSERT INTO orders (customer_id, vendor_id, rider_id, status, total_amount, payment_method) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [customer_id, vendor_id, rider_id || null, status || 'pending', total_amount, payment_method]
      );
      const order = orderResult.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, item_name, quantity, price) VALUES ($1, $2, $3, $4)`,
          [order.id, item.item_name, item.quantity, item.price]
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
