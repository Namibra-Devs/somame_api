-- Run this script in pgAdmin4 to add the ratings features

-- 1. Add target_type ENUM
CREATE TYPE target_type_enum AS ENUM ('vendor', 'rider');

-- 2. Add rating column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0.00;

-- 3. Create the ratings table
CREATE TABLE IF NOT EXISTS ratings (
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

-- 4. Create an index for quick lookups when calculating averages
CREATE INDEX IF NOT EXISTS idx_ratings_target ON ratings (target_id, target_type);
