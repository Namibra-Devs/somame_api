const { pool } = require('./config/db');

async function migrate() {
  try {
    console.log('Adding profile_picture to users table...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255);');
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
