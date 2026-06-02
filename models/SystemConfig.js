const { pool } = require('../config/db');

class SystemConfig {
  static async getAll() {
    const result = await pool.query('SELECT key, value FROM system_configs ORDER BY key ASC');
    // Convert to a key-value object
    const configMap = {};
    result.rows.forEach(row => {
      configMap[row.key] = parseFloat(row.value);
    });
    return configMap;
  }

  static async getByKey(key) {
    const result = await pool.query('SELECT value FROM system_configs WHERE key = $1', [key]);
    return result.rows.length ? parseFloat(result.rows[0].value) : null;
  }

  static async update(configs) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const [key, value] of Object.entries(configs)) {
        await client.query(
          `INSERT INTO system_configs (key, value) 
           VALUES ($1, $2) 
           ON CONFLICT (key) DO UPDATE 
           SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
          [key, value]
        );
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = SystemConfig;
