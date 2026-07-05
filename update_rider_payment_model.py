import re

with open('c:/xampp/htdocs/somame_api/models/RiderPaymentMethod.js', 'r', encoding='utf-8') as f:
    content = f.read()

update_method_old = """  static async update(id, updateData) {
    const { provider, account_name, account_number, bank_name, branch } = updateData;
    
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

    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);
    return result.rows[0];
  }"""

update_method_new = """  static async update(id, updateData) {
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
  }"""

content = content.replace(update_method_old, update_method_new)

with open('c:/xampp/htdocs/somame_api/models/RiderPaymentMethod.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated RiderPaymentMethod.js successfully")
