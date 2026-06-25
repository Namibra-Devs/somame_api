import re

with open('c:/xampp/htdocs/somame_api/models/Vendor.js', 'r', encoding='utf-8') as f:
    content = f.read()

find_by_id_old = """SELECT id, user_id, category_id, name, logo_url, rating, tags, is_open,
              ST_Y(location::geometry) as lat, 
              ST_X(location::geometry) as lng, 
              created_at, updated_at"""

find_by_id_new = """SELECT id, user_id, category_id, name, logo_url, rating, tags, is_open, address,
              ST_Y(location::geometry) as lat, 
              ST_X(location::geometry) as lng, 
              created_at, updated_at"""

content = content.replace(find_by_id_old, find_by_id_new)

create_old = """  static async create({ user_id, category_id = null, name, logo_url, rating = 0.00, tags, lat, lng }) {
    const result = await pool.query(
      `INSERT INTO vendors (user_id, category_id, name, logo_url, rating, tags, location) 
       VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326)) RETURNING *`,
      [user_id, category_id, name, logo_url, rating, tags, lng, lat]
    );"""

create_new = """  static async create({ user_id, category_id = null, name, logo_url, rating = 0.00, tags, address, lat, lng }) {
    const result = await pool.query(
      `INSERT INTO vendors (user_id, category_id, name, logo_url, rating, tags, address, location) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326)) RETURNING *`,
      [user_id, category_id, name, logo_url, rating, tags, address, lng, lat]
    );"""

content = content.replace(create_old, create_new)

update_old = """  static async updateByUserId(user_id, { name, category_id, logo_url, tags, lat, lng, is_open }) {
    const result = await pool.query(
      `UPDATE vendors 
       SET name = COALESCE($1, name), 
           category_id = COALESCE($2, category_id), 
           logo_url = COALESCE($3, logo_url), 
           tags = COALESCE($4, tags),
           is_open = COALESCE($5, is_open),
           updated_at = CURRENT_TIMESTAMP,
           location = CASE 
                        WHEN $6::numeric IS NOT NULL AND $7::numeric IS NOT NULL 
                        THEN ST_SetSRID(ST_MakePoint($7, $6), 4326) 
                        ELSE location 
                      END
       WHERE user_id = $8 
       RETURNING id, user_id, category_id, name, logo_url, rating, tags, is_open, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng, created_at, updated_at`,
      [name, category_id, logo_url, tags, is_open, lat, lng, user_id]
    );"""

update_new = """  static async updateByUserId(user_id, { name, category_id, logo_url, tags, address, lat, lng, is_open }) {
    const result = await pool.query(
      `UPDATE vendors 
       SET name = COALESCE($1, name), 
           category_id = COALESCE($2, category_id), 
           logo_url = COALESCE($3, logo_url), 
           tags = COALESCE($4, tags),
           address = COALESCE($5, address),
           is_open = COALESCE($6, is_open),
           updated_at = CURRENT_TIMESTAMP,
           location = CASE 
                        WHEN $7::numeric IS NOT NULL AND $8::numeric IS NOT NULL 
                        THEN ST_SetSRID(ST_MakePoint($8, $7), 4326) 
                        ELSE location 
                      END
       WHERE user_id = $9 
       RETURNING id, user_id, category_id, name, logo_url, rating, tags, is_open, address, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng, created_at, updated_at`,
      [name, category_id, logo_url, tags, address, is_open, lat, lng, user_id]
    );"""

content = content.replace(update_old, update_new)

with open('c:/xampp/htdocs/somame_api/models/Vendor.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Vendor.js successfully")
