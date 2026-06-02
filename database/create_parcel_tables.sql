-- Run this script in pgAdmin4 to add the parcel delivery features

-- 1. Create Enums
CREATE TYPE parcel_status_enum AS ENUM ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE delivery_speed_enum AS ENUM ('standard', 'express');

-- 2. system_configs table
CREATE TABLE IF NOT EXISTS system_configs (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configs for parcel delivery
INSERT INTO system_configs (key, value) VALUES 
('parcel_base_fare', 10.00),
('parcel_per_km_fee', 2.50),
('parcel_service_fee', 5.00),
('parcel_express_multiplier', 1.50) ON CONFLICT (key) DO NOTHING;

-- 3. parcel_orders table
CREATE TABLE IF NOT EXISTS parcel_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    rider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    pickup_location GEOMETRY(Point, 4326) NOT NULL,
    dropoff_location GEOMETRY(Point, 4326) NOT NULL,
    distance_km DECIMAL(10, 2) NOT NULL,
    estimated_time_mins INTEGER,
    item_description TEXT NOT NULL,
    item_value DECIMAL(10, 2) NOT NULL,
    item_photo_url VARCHAR(255),
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    delivery_speed delivery_speed_enum NOT NULL DEFAULT 'standard',
    status parcel_status_enum NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method payment_method_type NOT NULL,
    payment_status payment_status_type NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parcel_orders_customer_id ON parcel_orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_parcel_orders_rider_id ON parcel_orders (rider_id);

-- 4. parcel_deliveries table
CREATE TABLE IF NOT EXISTS parcel_deliveries (
    id SERIAL PRIMARY KEY,
    parcel_order_id INTEGER NOT NULL UNIQUE REFERENCES parcel_orders(id) ON DELETE CASCADE,
    rider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    current_location GEOMETRY(Point, 4326) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parcel_deliveries_rider_id ON parcel_deliveries (rider_id);
CREATE INDEX IF NOT EXISTS idx_parcel_deliveries_location ON parcel_deliveries USING GIST (current_location);

-- 5. parcel_tracking_history table
CREATE TABLE IF NOT EXISTS parcel_tracking_history (
    id SERIAL PRIMARY KEY,
    parcel_delivery_id INTEGER NOT NULL REFERENCES parcel_deliveries(id) ON DELETE CASCADE,
    location GEOMETRY(Point, 4326) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parcel_tracking_history_delivery_id ON parcel_tracking_history (parcel_delivery_id);
CREATE INDEX IF NOT EXISTS idx_parcel_tracking_history_location ON parcel_tracking_history USING GIST (location);
