import re

with open('c:/xampp/htdocs/somame_api/models/Order.js', 'r', encoding='utf-8') as f:
    content = f.read()

arrive_merchant_code = """
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
"""

content = content.replace("module.exports = Order;", arrive_merchant_code + "\nmodule.exports = Order;")

with open('c:/xampp/htdocs/somame_api/models/Order.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Order.js successfully")
