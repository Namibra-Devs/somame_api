-- Run this script in pgAdmin4 to create the promotions table

CREATE TYPE discount_type_enum AS ENUM ('percentage', 'fixed');

CREATE TABLE IF NOT EXISTS promotions (
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
