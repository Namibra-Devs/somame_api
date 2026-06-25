import re

with open('c:/xampp/htdocs/somame_api/models/Order.js', 'r', encoding='utf-8') as f:
    content = f.read()

assign_old = """  static async assignRider(id, riderId) {
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
              v.name as vendor_name, 
              vu.phone_number as vendor_phone, 
              ST_Y(v.location::geometry) as vendor_lat, 
              ST_X(v.location::geometry) as vendor_lng 
       FROM updated_order o 
       JOIN vendors v ON o.vendor_id = v.id
       JOIN users vu ON v.user_id = vu.id`,
      [riderId, id]
    );"""

assign_new = """  static async assignRider(id, riderId, riderLat = null, riderLng = null) {
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
    const result = await pool.query(query, params);"""

content = content.replace(assign_old, assign_new)

with open('c:/xampp/htdocs/somame_api/models/Order.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Order.js successfully")
