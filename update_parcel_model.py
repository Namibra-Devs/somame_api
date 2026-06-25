import re

with open('c:/xampp/htdocs/somame_api/models/ParcelOrder.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update create method
create_old = """    const {
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

    const query = `
      INSERT INTO parcel_orders (
        order_number, customer_id, pickup_location, dropoff_location, 
        distance_km, estimated_time_mins, item_description, item_value, 
        item_photo_url, recipient_name, recipient_phone, delivery_speed, 
        total_amount, payment_method
      ) 
      VALUES (
        $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), ST_SetSRID(ST_MakePoint($5, $6), 4326),
        $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *, 
        ST_Y(pickup_location::geometry) as pickup_lat, ST_X(pickup_location::geometry) as pickup_lng,
        ST_Y(dropoff_location::geometry) as dropoff_lat, ST_X(dropoff_location::geometry) as dropoff_lng
    `;

    const values = [
      order_number, customer_id, pickup_location.lng, pickup_location.lat, dropoff_location.lng, dropoff_location.lat,
      distance_km, estimated_time_mins, item_description, item_value, item_photo_url, recipient_name, recipient_phone,
      delivery_speed, total_amount, payment_method
    ];"""

create_new = """    const {
      order_number,
      customer_id,
      pickup_location,
      pickup_address,
      dropoff_location,
      dropoff_address,
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

    const query = `
      INSERT INTO parcel_orders (
        order_number, customer_id, pickup_location, pickup_address, dropoff_location, dropoff_address, 
        distance_km, estimated_time_mins, item_description, item_value, 
        item_photo_url, recipient_name, recipient_phone, delivery_speed, 
        total_amount, payment_method
      ) 
      VALUES (
        $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8,
        $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *, 
        ST_Y(pickup_location::geometry) as pickup_lat, ST_X(pickup_location::geometry) as pickup_lng,
        ST_Y(dropoff_location::geometry) as dropoff_lat, ST_X(dropoff_location::geometry) as dropoff_lng
    `;

    const values = [
      order_number, customer_id, pickup_location.lng, pickup_location.lat, pickup_address, dropoff_location.lng, dropoff_location.lat, dropoff_address,
      distance_km, estimated_time_mins, item_description, item_value, item_photo_url, recipient_name, recipient_phone,
      delivery_speed, total_amount, payment_method
    ];"""

content = content.replace(create_old, create_new)


# 2. Add findById and findRiderDeliveries methods
additional_methods = """
  static async findById(id) {
    const result = await pool.query(
      `SELECT *, 
              ST_Y(pickup_location::geometry) as pickup_lat, ST_X(pickup_location::geometry) as pickup_lng,
              ST_Y(dropoff_location::geometry) as dropoff_lat, ST_X(dropoff_location::geometry) as dropoff_lng
       FROM parcel_orders 
       WHERE id = $1`, 
      [id]
    );
    return result.rows[0];
  }

  static async findRiderDeliveries(riderId) {
    const result = await pool.query(
      `SELECT id, order_number, pickup_address, dropoff_address, distance_km, total_amount, status, created_at,
              ST_Y(pickup_location::geometry) as pickup_lat, ST_X(pickup_location::geometry) as pickup_lng,
              ST_Y(dropoff_location::geometry) as dropoff_lat, ST_X(dropoff_location::geometry) as dropoff_lng
       FROM parcel_orders 
       WHERE rider_id = $1 
       ORDER BY created_at DESC`,
      [riderId]
    );
    return result.rows;
  }
"""

content = content.replace("module.exports = ParcelOrder;", additional_methods + "\nmodule.exports = ParcelOrder;")

with open('c:/xampp/htdocs/somame_api/models/ParcelOrder.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ParcelOrder.js successfully")
