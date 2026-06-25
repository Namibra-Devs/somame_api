import re

with open('c:/xampp/htdocs/somame_api/models/Order.js', 'r', encoding='utf-8') as f:
    content = f.read()

find_rider_deliveries_code = """
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
"""

content = content.replace("module.exports = Order;", find_rider_deliveries_code + "\nmodule.exports = Order;")

with open('c:/xampp/htdocs/somame_api/models/Order.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Order.js successfully")
