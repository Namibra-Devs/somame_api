const { pool } = require('../config/db');

class VendorPaymentMethod {
  static async create(paymentData) {
    const {
      vendor_id,
      provider,
      network_or_bank,
      account_name,
      account_number,
      branch,
      is_default
    } = paymentData;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (is_default) {
        await client.query(
          'UPDATE vendor_payment_methods SET is_default = false WHERE vendor_id = $1',
          [vendor_id]
        );
      }

      const result = await client.query(
        `INSERT INTO vendor_payment_methods
         (vendor_id, provider, network_or_bank, account_name, account_number, branch, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          vendor_id,
          provider,
          network_or_bank,
          account_name,
          account_number,
          branch || null,
          Boolean(is_default)
        ]
      );

      // If it is the vendor's first payment method, automatically mark it default
      if (!is_default) {
        const checkCount = await client.query(
          'SELECT COUNT(*) FROM vendor_payment_methods WHERE vendor_id = $1',
          [vendor_id]
        );
        if (parseInt(checkCount.rows[0].count, 10) === 1) {
          const updated = await client.query(
            'UPDATE vendor_payment_methods SET is_default = true WHERE id = $1 RETURNING *',
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

  static async findByVendorId(vendorId) {
    const result = await pool.query(
      'SELECT * FROM vendor_payment_methods WHERE vendor_id = $1 ORDER BY is_default DESC, created_at DESC',
      [vendorId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM vendor_payment_methods WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async update(id, vendorId, updateData) {
    const {
      provider,
      network_or_bank,
      account_name,
      account_number,
      branch,
      is_default
    } = updateData;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (is_default === true) {
        await client.query(
          'UPDATE vendor_payment_methods SET is_default = false WHERE vendor_id = $1',
          [vendorId]
        );
      }

      let query = 'UPDATE vendor_payment_methods SET updated_at = CURRENT_TIMESTAMP';
      const values = [];
      let paramCount = 1;

      if (provider !== undefined) {
        query += `, provider = $${paramCount++}`;
        values.push(provider);
      }
      if (network_or_bank !== undefined) {
        query += `, network_or_bank = $${paramCount++}`;
        values.push(network_or_bank);
      }
      if (account_name !== undefined) {
        query += `, account_name = $${paramCount++}`;
        values.push(account_name);
      }
      if (account_number !== undefined) {
        query += `, account_number = $${paramCount++}`;
        values.push(account_number);
      }
      if (branch !== undefined) {
        query += `, branch = $${paramCount++}`;
        values.push(branch);
      }
      if (is_default !== undefined) {
        query += `, is_default = $${paramCount++}`;
        values.push(Boolean(is_default));
      }

      query += ` WHERE id = $${paramCount++} AND vendor_id = $${paramCount} RETURNING *`;
      values.push(id, vendorId);

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

  static async delete(id, vendorId) {
    const result = await pool.query(
      'DELETE FROM vendor_payment_methods WHERE id = $1 AND vendor_id = $2 RETURNING *',
      [id, vendorId]
    );
    return result.rows[0];
  }
}

module.exports = VendorPaymentMethod;
