-- Run this in pgAdmin4 to create the saved addresses table and type

-- Create Address Type Enum
DO $$ BEGIN
    CREATE TYPE address_type_enum AS ENUM ('home', 'work', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create saved_addresses table
CREATE TABLE IF NOT EXISTS saved_addresses (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type address_type_enum NOT NULL DEFAULT 'custom',
    name VARCHAR(100) NOT NULL,
    address_text TEXT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_addresses_customer_id ON saved_addresses(customer_id);
