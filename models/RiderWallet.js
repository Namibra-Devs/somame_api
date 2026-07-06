const { pool } = require('../config/db');

class RiderWallet {
  static async getWallet(riderId) {
    const result = await pool.query('SELECT * FROM rider_wallets WHERE rider_id = $1', [riderId]);
    if (result.rows.length === 0) {
      // create it
      const newWallet = await pool.query(
        'INSERT INTO rider_wallets (rider_id) VALUES ($1) RETURNING *',
        [riderId]
      );
      return newWallet.rows[0];
    }
    return result.rows[0];
  }

  static async addEarning(riderId, amount, client = pool) {
    const query = `
      INSERT INTO rider_wallets (rider_id, balance, total_earned) 
      VALUES ($1, $2, $2)
      ON CONFLICT (rider_id) 
      DO UPDATE SET 
        balance = rider_wallets.balance + EXCLUDED.balance,
        total_earned = rider_wallets.total_earned + EXCLUDED.total_earned,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await client.query(query, [riderId, amount]);
    return result.rows[0];
  }

  static async deductForPayout(riderId, amount, client = pool) {
    const query = `
      UPDATE rider_wallets
      SET 
        balance = balance - $2,
        total_withdrawn = total_withdrawn + $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE rider_id = $1 AND balance >= $2
      RETURNING *
    `;
    const result = await client.query(query, [riderId, amount]);
    if (result.rows.length === 0) {
      throw new Error('Insufficient balance');
    }
    return result.rows[0];
  }
}

module.exports = RiderWallet;
