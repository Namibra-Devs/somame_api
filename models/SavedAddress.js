const pool = require('../config/db');

class SavedAddress {
    static async create(addressData) {
        const { customer_id, type, name, address_text, location } = addressData;
        const query = `
            INSERT INTO saved_addresses (customer_id, type, name, address_text, location)
            VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326))
            RETURNING id, customer_id, type, name, address_text, 
                      ST_Y(location) as lat, ST_X(location) as lng, created_at, updated_at
        `;
        const values = [customer_id, type, name, address_text, location.lng, location.lat];
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    static async findByCustomerId(customerId) {
        const query = `
            SELECT id, customer_id, type, name, address_text, 
                   ST_Y(location) as lat, ST_X(location) as lng, created_at, updated_at
            FROM saved_addresses
            WHERE customer_id = $1
            ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(query, [customerId]);
        return rows;
    }

    static async findById(id) {
        const query = `
            SELECT id, customer_id, type, name, address_text, 
                   ST_Y(location) as lat, ST_X(location) as lng, created_at, updated_at
            FROM saved_addresses
            WHERE id = $1
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }

    static async update(id, addressData) {
        const { type, name, address_text, location } = addressData;
        
        let query;
        let values;

        if (location) {
            query = `
                UPDATE saved_addresses
                SET type = COALESCE($1, type),
                    name = COALESCE($2, name),
                    address_text = COALESCE($3, address_text),
                    location = ST_SetSRID(ST_MakePoint($4, $5), 4326),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $6
                RETURNING id, customer_id, type, name, address_text, 
                          ST_Y(location) as lat, ST_X(location) as lng, created_at, updated_at
            `;
            values = [type, name, address_text, location.lng, location.lat, id];
        } else {
            query = `
                UPDATE saved_addresses
                SET type = COALESCE($1, type),
                    name = COALESCE($2, name),
                    address_text = COALESCE($3, address_text),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING id, customer_id, type, name, address_text, 
                          ST_Y(location) as lat, ST_X(location) as lng, created_at, updated_at
            `;
            values = [type, name, address_text, id];
        }

        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    static async delete(id) {
        const query = `DELETE FROM saved_addresses WHERE id = $1 RETURNING *`;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }
}

module.exports = SavedAddress;
