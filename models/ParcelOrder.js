const { pool } = require('../config/db');

class ParcelOrder {
  static async create(parcelData) {
    const {
      order_number,
      customer_id,
      pickup_location,
      dropoff_location,
      distance_km,
      estimated_time_mins,
      item_description,
      item_value,
      item_photo_url,
      recipient_name,
      recipient_phone,
      delivery_speed,
      total_amount,
      payment_method
    } = parcelData;

    const result = await pool.query(
      `INSERT INTO parcel_orders (
        order_number, customer_id, pickup_location, dropoff_location, 
        distance_km, estimated_time_mins, item_description, item_value, 
        item_photo_url, recipient_name, recipient_phone, delivery_speed, 
        total_amount, payment_method
      ) 
      VALUES (
        $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), ST_SetSRID(ST_MakePoint($5, $6), 4326), 
        $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING id, order_number, status, total_amount, created_at`,
      [
        order_number,
        customer_id,
        pickup_location.lng, pickup_location.lat,
        dropoff_location.lng, dropoff_location.lat,
        distance_km,
        estimated_time_mins,
        item_description,
        item_value,
        item_photo_url || null,
        recipient_name,
        recipient_phone,
        delivery_speed,
        total_amount,
        payment_method
      ]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT 
        po.*,
        ST_Y(po.pickup_location::geometry) as pickup_lat,
        ST_X(po.pickup_location::geometry) as pickup_lng,
        ST_Y(po.dropoff_location::geometry) as dropoff_lat,
        ST_X(po.dropoff_location::geometry) as dropoff_lng,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.phone_number as customer_phone,
        r.first_name as rider_first_name,
        r.last_name as rider_last_name,
        r.phone_number as rider_phone
      FROM parcel_orders po
      JOIN users u ON po.customer_id = u.id
      LEFT JOIN users r ON po.rider_id = r.id
      WHERE po.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByCustomerId(customerId) {
    const result = await pool.query(
      `SELECT 
        id, order_number, distance_km, estimated_time_mins, 
        item_description, delivery_speed, status, total_amount, created_at 
      FROM parcel_orders 
      WHERE customer_id = $1 
      ORDER BY created_at DESC`,
      [customerId]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE parcel_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async assignRider(id, riderId) {
    const result = await pool.query(
      `UPDATE parcel_orders 
       SET rider_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 AND rider_id IS NULL 
       RETURNING *,
       ST_Y(pickup_location::geometry) as pickup_lat,
       ST_X(pickup_location::geometry) as pickup_lng,
       ST_Y(dropoff_location::geometry) as dropoff_lat,
       ST_X(dropoff_location::geometry) as dropoff_lng`,
      [riderId, 'accepted', id]
    );
    return result.rows[0];
  }
}

module.exports = ParcelOrder;
