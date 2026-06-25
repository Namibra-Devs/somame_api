ALTER TYPE order_status ADD VALUE 'arrived_at_vendor';
ALTER TYPE order_status ADD VALUE 'arrived_at_customer';

ALTER TABLE orders
ADD COLUMN delivery_location GEOMETRY(Point, 4326),
ADD COLUMN delivery_address TEXT,
ADD COLUMN merchant_otp VARCHAR(4),
ADD COLUMN delivery_otp VARCHAR(4),
ADD COLUMN pickup_proof_image_url TEXT;
