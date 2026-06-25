const { pool } = require('../config/db');

class ParcelDelivery {
  static async create(parcelOrderId, riderId, lat, lng) {
    const result = await pool.query(
      `INSERT INTO parcel_deliveries (parcel_order_id, rider_id, current_location) 
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)) 
       ON CONFLICT (parcel_order_id) DO UPDATE SET rider_id = EXCLUDED.rider_id, current_location = EXCLUDED.current_location
       RETURNING *,
       ST_Y(current_location::geometry) as current_lat,
       ST_X(current_location::geometry) as current_lng`,
      [parcelOrderId, riderId, lng, lat]
    );
    return result.rows[0];
  }
}

module.exports = ParcelDelivery;
