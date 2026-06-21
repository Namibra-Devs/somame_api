-- Create Enums (if they don't exist, though typically handled in schema.sql)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type_enum') THEN
        CREATE TYPE vehicle_type_enum AS ENUM ('motorbike', 'car');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'id_document_enum') THEN
        CREATE TYPE id_document_enum AS ENUM ('ghana_card', 'passport');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_enum') THEN
        CREATE TYPE verification_status_enum AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END$$;

-- rider_profiles table
CREATE TABLE rider_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    vehicle_type vehicle_type_enum,
    id_document_type id_document_enum,
    id_front_image_url VARCHAR(255),
    id_back_image_url VARCHAR(255),
    license_front_image_url VARCHAR(255),
    license_back_image_url VARCHAR(255),
    road_worthy_image_url VARCHAR(255),
    insurance_image_url VARCHAR(255),
    selfie_image_url VARCHAR(255),
    verification_status verification_status_enum DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rider_profiles_user_id ON rider_profiles(user_id);
