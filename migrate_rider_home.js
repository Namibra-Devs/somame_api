const { pool } = require('./config/db');

async function migrate() {
  try {
    console.log('Adding is_online and current_location to rider_profiles...');
    await pool.query('ALTER TABLE rider_profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;');
    await pool.query('ALTER TABLE rider_profiles ADD COLUMN IF NOT EXISTS current_location GEOMETRY(Point, 4326);');
    
    console.log('Creating rider_sessions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rider_sessions (
        id SERIAL PRIMARY KEY,
        rider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        online_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        offline_at TIMESTAMP WITH TIME ZONE,
        duration_minutes INTEGER
      );
    `);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_rider_sessions_rider_id ON rider_sessions(rider_id);`);

    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
