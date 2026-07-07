-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create Enums
CREATE TYPE user_role AS ENUM ('customer', 'rider', 'vendor', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered');
CREATE TYPE payment_method_type AS ENUM ('momo', 'card', 'cod', 'namibrapay', 'stripe');
CREATE TYPE payment_status_type AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE discount_type_enum AS ENUM ('percentage', 'fixed');
CREATE TYPE target_type_enum AS ENUM ('vendor', 'rider');
CREATE TYPE parcel_status_enum AS ENUM ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE delivery_speed_enum AS ENUM ('standard', 'express');
CREATE TYPE address_type_enum AS ENUM ('home', 'work', 'custom');

-- 1. categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. vendors table
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(255),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    tags VARCHAR(255),
    is_open BOOLEAN DEFAULT true,
    location GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. menu_categories table (Vendor specific)
CREATE TABLE menu_categories (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, name)
);

-- 5. menu_items table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    menu_category_id INTEGER REFERENCES menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    size VARCHAR(100),
    quantity INTEGER,
    image_url VARCHAR(255),
    extras JSONB DEFAULT '[]',
    is_in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. promotions table
CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    discount_type discount_type_enum NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_subtotal DECIMAL(10, 2) DEFAULT 0.00,
    max_discount_limit DECIMAL(10, 2),
    applicable_to JSONB DEFAULT '{"type": "all", "ids": []}',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, code)
);

-- 7. orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    rider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status order_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    promotion_id INTEGER REFERENCES promotions(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_method payment_method_type NOT NULL,
    payment_status payment_status_type NOT NULL DEFAULT 'pending',
    rider_tip DECIMAL(10, 2) DEFAULT 0.00,
    service_fee DECIMAL(10, 2) DEFAULT 0.00,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    customer_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. order_items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL
);

-- 5. deliveries table
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    rider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    current_location GEOMETRY(Point, 4326) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. tracking_history table
CREATE TABLE tracking_history (
    id SERIAL PRIMARY KEY,
    delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    location GEOMETRY(Point, 4326) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial Indexes
CREATE INDEX idx_vendors_location ON vendors USING GIST (location);
CREATE INDEX idx_deliveries_location ON deliveries USING GIST (current_location);
CREATE INDEX idx_tracking_history_location ON tracking_history USING GIST (location);

-- Regular Indexes for Foreign Keys and Lookups
CREATE INDEX idx_users_phone_number ON users (phone_number);
CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_orders_vendor_id ON orders (vendor_id);
CREATE INDEX idx_orders_rider_id ON orders (rider_id);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_deliveries_rider_id ON deliveries (rider_id);
CREATE INDEX idx_tracking_history_delivery_id ON tracking_history (delivery_id);

-- 12. ratings table
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id INTEGER NOT NULL, -- references either vendors(id) or users(id) depending on target_type
    target_type target_type_enum NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_order_target_rating UNIQUE (order_id, target_id, target_type)
);

CREATE INDEX idx_ratings_target ON ratings (target_id, target_type);

-- 13. system_configs table
CREATE TABLE system_configs (
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
('parcel_express_multiplier', 1.50),
('rider_base_pay', 10.00),
('rider_distance_bonus', 2.00),
('order_service_fee', 2.00) ON CONFLICT (key) DO NOTHING;

-- 14. parcel_orders table
CREATE TABLE parcel_orders (
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

CREATE INDEX idx_parcel_orders_customer_id ON parcel_orders (customer_id);
CREATE INDEX idx_parcel_orders_rider_id ON parcel_orders (rider_id);

-- 15. parcel_deliveries table
CREATE TABLE parcel_deliveries (
    id SERIAL PRIMARY KEY,
    parcel_order_id INTEGER NOT NULL UNIQUE REFERENCES parcel_orders(id) ON DELETE CASCADE,
    rider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    current_location GEOMETRY(Point, 4326) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parcel_deliveries_rider_id ON parcel_deliveries (rider_id);
CREATE INDEX idx_parcel_deliveries_location ON parcel_deliveries USING GIST (current_location);

-- 16. parcel_tracking_history table
CREATE TABLE parcel_tracking_history (
    id SERIAL PRIMARY KEY,
    parcel_delivery_id INTEGER NOT NULL REFERENCES parcel_deliveries(id) ON DELETE CASCADE,
    location GEOMETRY(Point, 4326) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parcel_tracking_history_delivery_id ON parcel_tracking_history (parcel_delivery_id);
CREATE INDEX idx_parcel_tracking_history_location ON parcel_tracking_history USING GIST (location);

-- 17. saved_addresses table
CREATE TABLE saved_addresses (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type address_type_enum NOT NULL DEFAULT 'custom',
    name VARCHAR(100) NOT NULL,
    address_text TEXT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_addresses_customer_id ON saved_addresses(customer_id);

-- 18. customer_payment_methods table
CREATE TABLE customer_payment_methods (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider payment_method_type NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    expiry_date VARCHAR(5),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_payment_methods_customer_id ON customer_payment_methods(customer_id);

-- Enums for rider_profiles
CREATE TYPE vehicle_type_enum AS ENUM ('motorbike', 'car');
CREATE TYPE id_document_enum AS ENUM ('ghana_card', 'passport');
CREATE TYPE verification_status_enum AS ENUM ('pending', 'approved', 'rejected');

-- 19. rider_profiles table
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

-- 20. job_declines table
CREATE TABLE job_declines (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    rider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_order_decline UNIQUE (order_number, rider_id)
);

CREATE INDEX idx_job_declines_order_number ON job_declines(order_number);
CREATE INDEX idx_job_declines_rider_id ON job_declines(rider_id);

-- 21. rider_payment_methods table
CREATE TABLE rider_payment_methods (
    id SERIAL PRIMARY KEY,
    rider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'bank' or 'momo'
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255),
    branch VARCHAR(255),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rider_payment_methods_rider_id ON rider_payment_methods(rider_id);

-- 22. rider_wallets table
CREATE TABLE rider_wallets (
    id SERIAL PRIMARY KEY,
    rider_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    total_earned DECIMAL(10, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. rider_earnings table
CREATE TABLE rider_earnings (
    id SERIAL PRIMARY KEY,
    rider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    parcel_order_id INTEGER REFERENCES parcel_orders(id) ON DELETE SET NULL,
    earning_type VARCHAR(50) NOT NULL, -- 'delivery', 'tip', 'streak_bonus'
    base_pay DECIMAL(10, 2) DEFAULT 0.00,
    distance_bonus DECIMAL(10, 2) DEFAULT 0.00,
    tip DECIMAL(10, 2) DEFAULT 0.00,
    amount DECIMAL(10, 2) NOT NULL, -- total earning for this row
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rider_earnings_rider_id ON rider_earnings(rider_id);

-- 24. rider_payouts table
CREATE TABLE rider_payouts (
    id SERIAL PRIMARY KEY,
    rider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method_id INTEGER REFERENCES rider_payment_methods(id) ON DELETE SET NULL,
    payout_method_name VARCHAR(50), -- e.g., 'Mobile Money' or 'Bank'
    payout_account_info VARCHAR(100), -- e.g., '*****234' or 'ABSA *******098'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'success', 'failed'
    reference_id VARCHAR(100), -- optional payout gateway ref
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rider_payouts_rider_id ON rider_payouts(rider_id);
