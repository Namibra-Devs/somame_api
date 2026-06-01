-- Run this script in pgAdmin4 to add order_number and item_id columns

ALTER TABLE orders 
ADD COLUMN order_number VARCHAR(50);

-- Generate a temporary unique order_number for existing rows
UPDATE orders SET order_number = 'ORD-' || id WHERE order_number IS NULL;

-- Now enforce uniqueness and not null
ALTER TABLE orders 
ALTER COLUMN order_number SET NOT NULL,
ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);

ALTER TABLE order_items
ADD COLUMN item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL;

ALTER TABLE orders
ADD COLUMN promotion_id INTEGER REFERENCES promotions(id) ON DELETE SET NULL,
ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN rider_tip DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN estimated_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN customer_note TEXT;
