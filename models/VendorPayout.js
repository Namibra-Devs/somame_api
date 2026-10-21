const { pool } = require('../config/db');

class VendorPayout {
  static async create(payoutData, client = pool) {
    const {
      vendor_id,
      amount,
      payment_method_id,
      method_label,
      account_masked,
      status = 'Paid',
      reference_id = null
    } = payoutData;

    const result = await client.query(
      `INSERT INTO vendor_payouts
       (vendor_id, amount, payment_method_id, method_label, account_masked, status, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        vendor_id,
        amount,
        payment_method_id || null,
        method_label,
        account_masked,
        status,
        reference_id
      ]
    );

    return result.rows[0];
  }

  static async findByVendorId(vendorId) {
    const result = await pool.query(
      'SELECT * FROM vendor_payouts WHERE vendor_id = $1 ORDER BY created_at DESC',
      [vendorId]
    );
    return result.rows;
  }

  static async getTotalWithdrawn(vendorId, client = pool) {
    const result = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_withdrawn
       FROM vendor_payouts
       WHERE vendor_id = $1 AND status != 'Failed'`,
      [vendorId]
    );
    return parseFloat(result.rows[0]?.total_withdrawn || 0);
  }
}

module.exports = VendorPayout;
