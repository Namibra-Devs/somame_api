-- dummy_seed.sql
-- Password for all users is: password123
-- This script contains dummy data to initialize the somame_api database.

-- 1. Insert Categories
INSERT INTO categories (name, description, is_active) VALUES
('Restaurants', 'Local and international food', true),
('Groceries', 'Daily essentials and fresh produce', true),
('Pharmacy', 'Medicines and health products', true),
('Electronics', 'Gadgets and accessories', true);

-- 2. Insert Users (Admin, Customer, Rider, Vendor)
-- Using bcrypt hash for 'password123' -> $2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK
INSERT INTO users (first_name, last_name, email, phone_number, password_hash, role, is_verified, is_active) VALUES
('Super', 'Admin', 'admin@somame.com', '0000000000', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'admin', true, true),
('John', 'Doe', 'customer@example.com', '1234567890', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'customer', true, true),
('Fast', 'Rider', 'rider@example.com', '0987654321', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'rider', true, true),
('Kofi', 'Vendor', 'vendor@example.com', '0555555555', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'vendor', true, true);

-- 3. Insert Vendor profile (linked to user id 4)
INSERT INTO vendors (user_id, category_id, name, description, rating, tags, is_open, location) VALUES
(4, 1, 'Kofi Food Joint', 'The best local dishes in town', 4.5, 'local,spicy,ghanaian', true, ST_SetSRID(ST_MakePoint(-0.186964, 5.603717), 4326));

-- 4. Insert Vendor Operating Hours
INSERT INTO vendor_operating_hours (vendor_id, day_of_week, is_open, open_time, close_time) VALUES
(1, 'Monday', true, '08:00', '22:00'),
(1, 'Tuesday', true, '08:00', '22:00'),
(1, 'Wednesday', true, '08:00', '22:00'),
(1, 'Thursday', true, '08:00', '22:00'),
(1, 'Friday', true, '08:00', '23:00'),
(1, 'Saturday', true, '09:00', '23:00'),
(1, 'Sunday', false, NULL, NULL);

-- 5. Insert Vendor Menu Categories
INSERT INTO menu_categories (vendor_id, name, description) VALUES
(1, 'Main Courses', 'Heavy meals to fill your stomach'),
(1, 'Drinks', 'Refreshing beverages');

-- 6. Insert Menu Items
INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES
(1, 1, 'Jollof Rice with Chicken', 'Spicy West African rice with grilled chicken', 45.00, 'Regular', 100, true),
(1, 1, 'Waakye with Fish', 'Rice and beans with fried fish and egg', 35.00, 'Large', 50, true),
(1, 2, 'Fresh Pineapple Juice', '100% natural fruit juice', 15.00, '500ml', 200, true);

-- 7. Insert Saved Addresses for Customer (user id 2)
INSERT INTO saved_addresses (customer_id, type, name, address_text, location) VALUES
(2, 'home', 'Home', 'Accra Mall area, Plot 23', ST_SetSRID(ST_MakePoint(-0.174828, 5.614619), 4326));

-- 8. Insert Rider Profile (user id 3)
INSERT INTO rider_profiles (user_id, vehicle_type, id_document_type, verification_status) VALUES
(3, 'motorbike', 'ghana_card', 'approved');

-- 9. System Configs
INSERT INTO system_configs (key, value) VALUES 
('parcel_base_fare', 10.00),
('parcel_per_km_fee', 2.50),
('parcel_service_fee', 5.00),
('parcel_express_multiplier', 1.50),
('rider_base_pay', 10.00),
('rider_distance_bonus', 2.00),
('order_service_fee', 2.00) ON CONFLICT (key) DO NOTHING;
