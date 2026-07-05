const { pool } = require('../config/db');

class RiderPaymentMethod {
  static async create(paymentData) {
    const {
      rider_id,
      provider,
      account_name,
      account_number,
      bank_name,
      branch,
      is_default
    } = paymentData;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (is_default) {
        await client.query(
          'UPDATE rider_payment_methods SET is_default = false WHERE rider_id = $1',
          [rider_id]
        );
      }

      const result = await client.query(
        `INSERT INTO rider_payment_methods 
         (rider_id, provider, account_name, account_number, bank_name, branch, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [rider_id, provider, account_name, account_number, bank_name, branch, is_default || false]
      );

      // If it's the first payment method, set it as default
      if (!is_default) {
        const checkCount = await client.query('SELECT COUNT(*) FROM rider_payment_methods WHERE rider_id = $1', [rider_id]);
        if (parseInt(checkCount.rows[0].count) === 1) {
          const updated = await client.query(
            'UPDATE rider_payment_methods SET is_default = true WHERE id = $1 RETURNING *',
            [result.rows[0].id]
          );
          await client.query('COMMIT');
          return updated.rows[0];
        }
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByRiderId(riderId) {
    const result = await pool.query(
      'SELECT * FROM rider_payment_methods WHERE rider_id = $1 ORDER BY created_at DESC',
      [riderId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM rider_payment_methods WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async update(id, updateData) {
    const { provider, account_name, account_number, bank_name, branch, is_default } = updateData;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // If setting to default, unset others first
      if (is_default === true) {
        // We need rider_id to unset others. Fetch it first.
        const current = await client.query('SELECT rider_id FROM rider_payment_methods WHERE id = $1', [id]);
        if (current.rows.length > 0) {
          await client.query(
            'UPDATE rider_payment_methods SET is_default = false WHERE rider_id = $1',
            [current.rows[0].rider_id]
          );
        }
      }

      let query = 'UPDATE rider_payment_methods SET updated_at = CURRENT_TIMESTAMP';
      const values = [];
      let paramCount = 1;

      if (provider !== undefined) {
        query += `, provider = $${paramCount}`;
        values.push(provider);
        paramCount++;
      }
      if (account_name !== undefined) {
        query += `, account_name = $${paramCount}`;
        values.push(account_name);
        paramCount++;
      }
      if (account_number !== undefined) {
        query += `, account_number = $${paramCount}`;
        values.push(account_number);
        paramCount++;
      }
      if (bank_name !== undefined) {
        query += `, bank_name = $${paramCount}`;
        values.push(bank_name);
        paramCount++;
      }
      if (branch !== undefined) {
        query += `, branch = $${paramCount}`;
        values.push(branch);
        paramCount++;
      }
      if (is_default !== undefined) {
        query += `, is_default = $${paramCount}`;
        values.push(is_default);
        paramCount++;
      }

      query += ` WHERE id = $${paramCount} RETURNING *`;
      values.push(id);

      const result = await client.query(query, values);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM rider_payment_methods WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = RiderPaymentMethod;
