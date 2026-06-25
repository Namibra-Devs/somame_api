import re

with open('c:/xampp/htdocs/somame_api/models/Order.js', 'r', encoding='utf-8') as f:
    content = f.read()

confirm_pickup_old = """  static async confirmPickup(id, proofImageUrl) {
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
              ST_DistanceSphere(v.location::geometry, o.delivery_location::geometry) / 1000 as distance_to_customer_km,
              CEIL(ST_DistanceSphere(v.location::geometry, o.delivery_location::geometry) / 1000 * 3) as estimated_time_to_customer_mins
       FROM updated_order o
       JOIN users u ON o.customer_id = u.id
       JOIN vendors v ON o.vendor_id = v.id`,
      [id, proofImageUrl]
    );"""

confirm_pickup_new = """  static async confirmPickup(id, proofImageUrl) {
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
    );"""

content = content.replace(confirm_pickup_old, confirm_pickup_new)

with open('c:/xampp/htdocs/somame_api/models/Order.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated confirmPickup again in Order.js")
