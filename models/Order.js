const { pool } = require('../config/db');

class Order {
  static async findById(id) {
    const result = await pool.query(`
      SELECT o.*, 
             ST_Y(o.delivery_location::geometry) as delivery_lat, 
             ST_X(o.delivery_location::geometry) as delivery_lng,
             v.name as vendor_name, 
             v.address as vendor_address,
             v.logo_url as vendor_logo_url,
             ST_Y(v.location::geometry) as vendor_lat, 
             ST_X(v.location::geometry) as vendor_lng,
             vu.phone_number as vendor_phone
      FROM orders o
      JOIN vendors v ON o.vendor_id = v.id
      JOIN users vu ON v.user_id = vu.id
      WHERE o.id = $1
    `, [id]);
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

  static async assignRider(id, riderId, riderLat = null, riderLng = null) {
    const query = `WITH updated_order AS (
         UPDATE orders 
         SET rider_id = $1, status = 'accepted'
         WHERE id = $2 AND rider_id IS NULL 
         RETURNING *
       )
       SELECT o.*, 
              ST_Y(o.delivery_location::geometry) as delivery_lat, 
              ST_X(o.delivery_location::geometry) as delivery_lng,
              v.name as vendor_name, 
              vu.phone_number as vendor_phone, 
              v.address as vendor_address,
              ST_Y(v.location::geometry) as vendor_lat, 
              ST_X(v.location::geometry) as vendor_lng
              ${riderLat && riderLng ? `, ST_DistanceSphere(v.location::geometry, ST_SetSRID(ST_MakePoint($4, $3), 4326)) / 1000 as distance_to_vendor_km,
              CEIL(ST_DistanceSphere(v.location::geometry, ST_SetSRID(ST_MakePoint($4, $3), 4326)) / 1000 * 3) as estimated_time_to_vendor_mins` : ''}
       FROM updated_order o 
       JOIN vendors v ON o.vendor_id = v.id
       JOIN users vu ON v.user_id = vu.id`;
       
    const params = riderLat && riderLng ? [riderId, id, riderLat, riderLng] : [riderId, id];
    const result = await pool.query(query, params);
    return result.rows[0];
  }

  static async getItemsByOrderId(orderId) {
    const result = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    return result.rows;
  }

  static async createWithItems({ order_number, customer_id, vendor_id, rider_id, status, total_amount, promotion_id, discount_amount, rider_tip, estimated_delivery_time, customer_note, payment_method, items, delivery_location, delivery_address }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const merchant_otp = Math.floor(1000 + Math.random() * 9000).toString();
      const delivery_otp = Math.floor(1000 + Math.random() * 9000).toString();

      let orderQuery = `INSERT INTO orders (order_number, customer_id, vendor_id, rider_id, status, total_amount, promotion_id, discount_amount, rider_tip, estimated_delivery_time, customer_note, payment_method, merchant_otp, delivery_otp, delivery_address`;
      let orderValues = [order_number, customer_id, vendor_id, rider_id || null, status || 'pending', total_amount, promotion_id || null, discount_amount || 0.00, rider_tip || 0.00, estimated_delivery_time || null, customer_note || null, payment_method, merchant_otp, delivery_otp, delivery_address || null];
      
      if (delivery_location && delivery_location.lat && delivery_location.lng) {
          orderQuery += `, delivery_location) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, ST_SetSRID(ST_MakePoint($16, $17), 4326)) RETURNING *, ST_Y(delivery_location::geometry) as delivery_lat, ST_X(delivery_location::geometry) as delivery_lng`;
          orderValues.push(delivery_location.lng, delivery_location.lat);
      } else {
          orderQuery += `) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`;
      }

      const orderResult = await client.query(orderQuery, orderValues);
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
  static async confirmPickup(id, proofImageUrl) {
    const result = await pool.query(
      `WITH updated_order AS (
         UPDATE orders 
         SET status = 'out_for_delivery', pickup_proof_image_url = $2
         WHERE id = $1
         RETURNING *
       )
       SELECT o.*, 
              ST_Y(o.delivery_location::geometry) as delivery_lat, 
              ST_X(o.delivery_location::geometry) as delivery_lng,
              u.first_name as customer_first_name,
              u.last_name as customer_last_name,
              u.phone_number as customer_phone,
              vu.phone_number as vendor_phone,
              ST_DistanceSphere(v.location::geometry, o.delivery_location::geometry) / 1000 as distance_to_customer_km,
              CEIL(ST_DistanceSphere(v.location::geometry, o.delivery_location::geometry) / 1000 * 3) as estimated_time_to_customer_mins
       FROM updated_order o
       JOIN users u ON o.customer_id = u.id
       JOIN vendors v ON o.vendor_id = v.id
       JOIN users vu ON v.user_id = vu.id`,
      [id, proofImageUrl]
    );
    return result.rows[0];
  }
  static async arriveMerchant(id) {
    const result = await pool.query(
      `WITH updated_order AS (
         UPDATE orders 
         SET status = 'arrived_at_vendor'
         WHERE id = $1
         RETURNING *
       )
       SELECT o.*, 
              v.name as vendor_name, 
              v.address as vendor_address
       FROM updated_order o
       JOIN vendors v ON o.vendor_id = v.id`,
      [id]
    );
    return result.rows[0];
  }
  static async findRiderDeliveries(riderId) {
    const result = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, o.delivery_address,
              v.name as vendor_name, v.logo_url as vendor_logo_url, v.address as vendor_address,
              ST_Y(o.delivery_location::geometry) as delivery_lat, ST_X(o.delivery_location::geometry) as delivery_lng,
              ST_Y(v.location::geometry) as vendor_lat, ST_X(v.location::geometry) as vendor_lng
       FROM orders o
       JOIN vendors v ON o.vendor_id = v.id
       WHERE o.rider_id = $1 
       ORDER BY o.created_at DESC`,
      [riderId]
    );
    return result.rows;
  }
}

module.exports = Order;
