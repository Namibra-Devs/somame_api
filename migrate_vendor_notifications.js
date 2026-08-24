const { pool } = require('./config/db');

async function run() {
  try {
    await pool.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS in_app_notifications BOOLEAN DEFAULT true;`);
    await pool.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;`);
    await pool.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT true;`);
    console.log("Migration successful: added notification columns to vendors table.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

run();
