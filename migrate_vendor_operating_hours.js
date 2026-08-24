const { pool } = require('./config/db');

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_operating_hours (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
        day_of_week VARCHAR(10) NOT NULL, -- e.g., 'Monday'
        is_open BOOLEAN DEFAULT false,
        open_time TIME,
        close_time TIME,
        UNIQUE(vendor_id, day_of_week)
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_holidays (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        is_closed BOOLEAN DEFAULT true,
        UNIQUE(vendor_id, date)
      );
    `);
    
    console.log("Migration successful: created vendor_operating_hours and vendor_holidays tables.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

run();
