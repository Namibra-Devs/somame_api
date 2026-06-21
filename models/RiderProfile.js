const { pool } = require('../config/db');

class RiderProfile {
  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT rp.*, u.first_name, u.last_name, u.phone_number 
       FROM rider_profiles rp
       JOIN users u ON rp.user_id = u.id
       WHERE rp.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async createOrUpdate(data) {
    const {
      user_id,
      date_of_birth,
      vehicle_type,
      id_document_type,
      id_front_image_url,
      id_back_image_url,
      license_front_image_url,
      license_back_image_url,
      road_worthy_image_url,
      insurance_image_url,
      selfie_image_url,
      verification_status = 'pending'
    } = data;

    await pool.query(
      `INSERT INTO rider_profiles (
         user_id, date_of_birth, vehicle_type, id_document_type, 
         id_front_image_url, id_back_image_url, license_front_image_url, 
         license_back_image_url, road_worthy_image_url, insurance_image_url, 
         selfie_image_url, verification_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (user_id) DO UPDATE SET
         date_of_birth = EXCLUDED.date_of_birth,
         vehicle_type = EXCLUDED.vehicle_type,
         id_document_type = EXCLUDED.id_document_type,
         id_front_image_url = EXCLUDED.id_front_image_url,
         id_back_image_url = EXCLUDED.id_back_image_url,
         license_front_image_url = EXCLUDED.license_front_image_url,
         license_back_image_url = EXCLUDED.license_back_image_url,
         road_worthy_image_url = EXCLUDED.road_worthy_image_url,
         insurance_image_url = EXCLUDED.insurance_image_url,
         selfie_image_url = EXCLUDED.selfie_image_url,
         verification_status = EXCLUDED.verification_status,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        user_id, date_of_birth, vehicle_type, id_document_type,
        id_front_image_url, id_back_image_url, license_front_image_url,
        license_back_image_url, road_worthy_image_url, insurance_image_url,
        selfie_image_url, verification_status
      ]
    );

    return await this.findByUserId(user_id);
  }

  static async updateVerificationStatus(userId, status) {
    const result = await pool.query(
      `UPDATE rider_profiles 
       SET verification_status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 RETURNING *`,
      [status, userId]
    );
    return result.rows[0];
  }
}

module.exports = RiderProfile;
