const { pool } = require('./config/db');

async function run() {
  try {
    await pool.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS description TEXT;`);
    console.log("Migration successful: added description to vendors table.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

run();
