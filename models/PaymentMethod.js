const { pool } = require('../config/db');

class PaymentMethod {
  static async findByCustomerId(customerId) {
    const result = await pool.query(
      `SELECT id, customer_id, provider, account_name, account_number, expiry_date, is_default, created_at, updated_at
       FROM customer_payment_methods 
       WHERE customer_id = $1 
       ORDER BY is_default DESC, created_at DESC`,
      [customerId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT * FROM customer_payment_methods WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(data) {
    const { customer_id, provider, account_name, account_number, expiry_date, is_default = false } = data;
    
    // Check if this is the first payment method, if so, make it default
    let makeDefault = is_default;
    if (!makeDefault) {
      const existing = await this.findByCustomerId(customer_id);
      if (existing.length === 0) {
        makeDefault = true;
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (makeDefault) {
        // Reset others to false
        await client.query(
          `UPDATE customer_payment_methods SET is_default = false WHERE customer_id = $1`,
          [customer_id]
        );
      }

      const result = await client.query(
        `INSERT INTO customer_payment_methods 
         (customer_id, provider, account_name, account_number, expiry_date, is_default)
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [customer_id, provider, account_name, account_number, expiry_date, makeDefault]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async setAsDefault(id, customerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Set all to false
      await client.query(
        `UPDATE customer_payment_methods SET is_default = false WHERE customer_id = $1`,
        [customerId]
      );

      // Set specified to true
      const result = await client.query(
        `UPDATE customer_payment_methods SET is_default = true WHERE id = $1 AND customer_id = $2 RETURNING *`,
        [id, customerId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id, customerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if it's the default
      const method = await client.query(
        `SELECT is_default FROM customer_payment_methods WHERE id = $1 AND customer_id = $2`,
        [id, customerId]
      );

      if (method.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      await client.query(
        `DELETE FROM customer_payment_methods WHERE id = $1 AND customer_id = $2`,
        [id, customerId]
      );

      // If it was default, make the most recent remaining one default
      if (method.rows[0].is_default) {
        const remaining = await client.query(
          `SELECT id FROM customer_payment_methods WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [customerId]
        );
        if (remaining.rows.length > 0) {
          await client.query(
            `UPDATE customer_payment_methods SET is_default = true WHERE id = $1`,
            [remaining.rows[0].id]
          );
        }
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

module.exports = PaymentMethod;
