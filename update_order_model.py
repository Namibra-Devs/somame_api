import re

with open('c:/xampp/htdocs/somame_api/models/Order.js', 'r', encoding='utf-8') as f:
    content = f.read()

assign_rider_old = """  static async assignRider(id, riderId) {
    const result = await pool.query(
      `UPDATE orders 
       SET rider_id = $1 
       WHERE id = $2 AND rider_id IS NULL 
       RETURNING *`,
      [riderId, id]
    );
    return result.rows[0];
  }"""

assign_rider_new = """  static async assignRider(id, riderId) {
    const result = await pool.query(
      `WITH updated_order AS (
         UPDATE orders 
         SET rider_id = $1, status = 'accepted'
         WHERE id = $2 AND rider_id IS NULL 
         RETURNING *
       )
       SELECT o.*, 
              ST_Y(o.delivery_location::geometry) as delivery_lat, 
              ST_X(o.delivery_location::geometry) as delivery_lng,
              v.store_name as vendor_name, 
              v.phone_number as vendor_phone, 
              v.address as vendor_address,
              ST_Y(v.location::geometry) as vendor_lat, 
              ST_X(v.location::geometry) as vendor_lng 
       FROM updated_order o 
       JOIN vendors v ON o.vendor_id = v.id`,
      [riderId, id]
    );
    return result.rows[0];
  }"""

create_old = """  static async createWithItems({ order_number, customer_id, vendor_id, rider_id, status, total_amount, promotion_id, discount_amount, rider_tip, estimated_delivery_time, customer_note, payment_method, items, delivery_location }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        `INSERT INTO orders (order_number, customer_id, vendor_id, rider_id, status, total_amount, promotion_id, discount_amount, rider_tip, estimated_delivery_time, customer_note, payment_method) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [order_number, customer_id, vendor_id, rider_id || null, status || 'pending', total_amount, promotion_id || null, discount_amount || 0.00, rider_tip || 0.00, estimated_delivery_time || null, customer_note || null, payment_method]
      );
      const order = orderResult.rows[0];"""

create_new = """  static async createWithItems({ order_number, customer_id, vendor_id, rider_id, status, total_amount, promotion_id, discount_amount, rider_tip, estimated_delivery_time, customer_note, payment_method, items, delivery_location, delivery_address }) {
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
      const order = orderResult.rows[0];"""

content = content.replace(assign_rider_old, assign_rider_new)
content = content.replace(create_old, create_new)

# Add confirmPickup method to Order model
confirm_pickup_code = """
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
              u.phone_number as customer_phone
       FROM updated_order o
       JOIN users u ON o.customer_id = u.id`,
      [id, proofImageUrl]
    );
    return result.rows[0];
  }
"""
content = content.replace("module.exports = Order;", confirm_pickup_code + "\nmodule.exports = Order;")

with open('c:/xampp/htdocs/somame_api/models/Order.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Order.js successfully")
