-- 10_vendors_seed.sql
-- This script contains dummy data for 10 sample vendors, their categories, menu categories, and menu items.
-- It assumes that Categories (id 1 to 4) already exist as per dummy_seed.sql.
-- Password for all users is: password123

-- 1. Insert 10 Vendor Users
INSERT INTO users (first_name, last_name, email, phone_number, password_hash, role, is_verified, is_active) VALUES
('Mama', 'Kitchen', 'mama@example.com', '0555555501', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'vendor', true, true),
('Pizza', 'Haven', 'pizza@example.com', '0555555502', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'vendor', true, true),
('Fresh', 'Mart', 'freshmart@example.com', '0555555503', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'vendor', true, true),
('Daily', 'Needs', 'dailyneeds@example.com', '0555555504', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'vendor', true, true),
('Health', 'Plus', 'healthplus@example.com', '0555555505', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'vendor', true, true),
('Care', 'Cross', 'carecross@example.com', '0555555506', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'vendor', true, true),
('Gadget', 'World', 'gadgetworld@example.com', '0555555507', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'vendor', true, true),
('Tech', 'Hub', 'techhub@example.com', '0555555508', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'vendor', true, true),
('Burger', 'Point', 'burgerpoint@example.com', '0555555509', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'vendor', true, true),
('Green', 'Valley', 'greenvalley@example.com', '0555555510', '$2a$10$Ol8eQrKtXejwwhoTwIx6/esDVg5dOnXPCjz.OYzVzjZEmnmsJgztK', 'vendor', true, true);

-- Note: We assume the above users get IDs 5 to 14 if dummy_seed.sql has already created users 1 to 4.
-- If the database is empty, the IDs will be 1 to 10. 
-- For the sake of this script, we will use a DO block or subqueries to ensure correct linking,
-- but a simple approach is to use the emails to fetch the generated user_id.

DO $$
DECLARE
    v2_user_id INT; v3_user_id INT; v4_user_id INT; v5_user_id INT; v6_user_id INT;
    v7_user_id INT; v8_user_id INT; v9_user_id INT; v10_user_id INT; v11_user_id INT;
    v2_id INT; v3_id INT; v4_id INT; v5_id INT; v6_id INT;
    v7_id INT; v8_id INT; v9_id INT; v10_id INT; v11_id INT;
    mc_id INT;
BEGIN
    SELECT id INTO v2_user_id FROM users WHERE email = 'mama@example.com';
    SELECT id INTO v3_user_id FROM users WHERE email = 'pizza@example.com';
    SELECT id INTO v4_user_id FROM users WHERE email = 'freshmart@example.com';
    SELECT id INTO v5_user_id FROM users WHERE email = 'dailyneeds@example.com';
    SELECT id INTO v6_user_id FROM users WHERE email = 'healthplus@example.com';
    SELECT id INTO v7_user_id FROM users WHERE email = 'carecross@example.com';
    SELECT id INTO v8_user_id FROM users WHERE email = 'gadgetworld@example.com';
    SELECT id INTO v9_user_id FROM users WHERE email = 'techhub@example.com';
    SELECT id INTO v10_user_id FROM users WHERE email = 'burgerpoint@example.com';
    SELECT id INTO v11_user_id FROM users WHERE email = 'greenvalley@example.com';

    -- 2. Insert 10 Vendors
    INSERT INTO vendors (user_id, category_id, name, description, rating, tags, is_open, location) VALUES
    (v2_user_id, 1, 'Mama''s Kitchen', 'Authentic local cuisine', 4.7, 'local,food', true, ST_SetSRID(ST_MakePoint(-0.187, 5.604), 4326)) RETURNING id INTO v2_id;
    INSERT INTO vendors (user_id, category_id, name, description, rating, tags, is_open, location) VALUES
    (v3_user_id, 1, 'Pizza Haven', 'Best pizzas in town', 4.8, 'pizza,fastfood', true, ST_SetSRID(ST_MakePoint(-0.188, 5.605), 4326)) RETURNING id INTO v3_id;
    INSERT INTO vendors (user_id, category_id, name, description, rating, tags, is_open, location) VALUES
    (v4_user_id, 2, 'Fresh Mart', 'Your daily groceries', 4.5, 'groceries,fresh', true, ST_SetSRID(ST_MakePoint(-0.189, 5.606), 4326)) RETURNING id INTO v4_id;
    INSERT INTO vendors (user_id, category_id, name, description, rating, tags, is_open, location) VALUES
    (v5_user_id, 2, 'Daily Needs Supermarket', 'Everything you need', 4.6, 'supermarket,essentials', true, ST_SetSRID(ST_MakePoint(-0.190, 5.607), 4326)) RETURNING id INTO v5_id;
    INSERT INTO vendors (user_id, category_id, name, description, rating, tags, is_open, location) VALUES
    (v6_user_id, 3, 'HealthPlus Pharmacy', 'Your health first', 4.9, 'pharmacy,drugs', true, ST_SetSRID(ST_MakePoint(-0.191, 5.608), 4326)) RETURNING id INTO v6_id;
    INSERT INTO vendors (user_id, category_id, name, description, rating, tags, is_open, location) VALUES
    (v7_user_id, 3, 'Care Cross Pharmacy', '24/7 Pharmacy', 4.8, 'pharmacy,medicine', true, ST_SetSRID(ST_MakePoint(-0.192, 5.609), 4326)) RETURNING id INTO v7_id;
    INSERT INTO vendors (user_id, category_id, name, description, rating, tags, is_open, location) VALUES
    (v8_user_id, 4, 'Gadget World', 'Latest electronics', 4.7, 'electronics,phones', true, ST_SetSRID(ST_MakePoint(-0.193, 5.610), 4326)) RETURNING id INTO v8_id;
    INSERT INTO vendors (user_id, category_id, name, description, rating, tags, is_open, location) VALUES
    (v9_user_id, 4, 'Tech Hub', 'Computers and accessories', 4.6, 'laptops,accessories', true, ST_SetSRID(ST_MakePoint(-0.194, 5.611), 4326)) RETURNING id INTO v9_id;
    INSERT INTO vendors (user_id, category_id, name, description, rating, tags, is_open, location) VALUES
    (v10_user_id, 1, 'Burger Point', 'Delicious burgers', 4.5, 'burger,fastfood', true, ST_SetSRID(ST_MakePoint(-0.195, 5.612), 4326)) RETURNING id INTO v10_id;
    INSERT INTO vendors (user_id, category_id, name, description, rating, tags, is_open, location) VALUES
    (v11_user_id, 2, 'Green Valley Organics', 'Organic farm produce', 4.9, 'organic,vegetables', true, ST_SetSRID(ST_MakePoint(-0.196, 5.613), 4326)) RETURNING id INTO v11_id;

    -- 3. Insert Menu Categories & Menu Items for Mama's Kitchen (Vendor 2)
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v2_id, 'Local Dishes', 'Delicious local meals') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v2_id, mc_id, 'Banku & Tilapia', 'Hot banku with grilled tilapia', 65.00, 'Regular', 50, true);
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v2_id, 'Drinks', 'Cold beverages') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v2_id, mc_id, 'Malta Guinness', 'Chilled Malta Guinness', 10.00, '330ml', 100, true);

    -- Pizza Haven (Vendor 3)
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v3_id, 'Pizzas', 'Oven baked pizzas') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v3_id, mc_id, 'Pepperoni Pizza', 'Classic pepperoni with extra cheese', 85.00, 'Large', 40, true);
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v3_id, 'Sides', 'Extra sides') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v3_id, mc_id, 'Garlic Bread', 'Crispy garlic bread', 25.00, 'Regular', 60, true);

    -- Fresh Mart (Vendor 4)
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v4_id, 'Vegetables', 'Fresh veggies') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v4_id, mc_id, 'Fresh Tomatoes', '1kg of fresh tomatoes', 20.00, '1kg', 100, true);
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v4_id, 'Fruits', 'Fresh fruits') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v4_id, mc_id, 'Bananas', 'Bunch of bananas', 15.00, '1 Bunch', 50, true);

    -- Daily Needs Supermarket (Vendor 5)
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v5_id, 'Household', 'Home essentials') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v5_id, mc_id, 'Toilet Roll', '10 pack soft tissue', 35.00, '10-Pack', 200, true);
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v5_id, 'Snacks', 'Quick snacks') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v5_id, mc_id, 'Plantain Chips', 'Crispy plantain chips', 5.00, '100g', 300, true);

    -- HealthPlus Pharmacy (Vendor 6)
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v6_id, 'Painkillers', 'Pain relief') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v6_id, mc_id, 'Paracetamol', 'Pain relief tablets', 10.00, '10 Tabs', 500, true);
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v6_id, 'Vitamins', 'Supplements') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v6_id, mc_id, 'Vitamin C', 'Immune support', 45.00, '30 Tabs', 150, true);

    -- Care Cross Pharmacy (Vendor 7)
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v7_id, 'First Aid', 'Emergency supplies') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v7_id, mc_id, 'Plasters', 'Waterproof plasters', 15.00, '20 Pack', 100, true);
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v7_id, 'Supplements', 'Health supplements') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v7_id, mc_id, 'Omega 3', 'Fish oil capsules', 90.00, '60 Caps', 80, true);

    -- Gadget World (Vendor 8)
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v8_id, 'Phones', 'Smartphones') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v8_id, mc_id, 'iPhone 14', 'Apple iPhone 14 128GB', 12000.00, '128GB', 15, true);
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v8_id, 'Laptops', 'Computers') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v8_id, mc_id, 'MacBook Pro', 'Apple M2 MacBook Pro', 18000.00, '256GB', 10, true);

    -- Tech Hub (Vendor 9)
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v9_id, 'Monitors', 'Display screens') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v9_id, mc_id, '24-inch Monitor', 'Dell 1080p Monitor', 1500.00, '24"', 25, true);
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v9_id, 'Cables', 'Accessories') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v9_id, mc_id, 'HDMI Cable', 'High-speed HDMI', 50.00, '2m', 100, true);

    -- Burger Point (Vendor 10)
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v10_id, 'Burgers', 'Gourmet burgers') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v10_id, mc_id, 'Cheese Burger', 'Beef burger with cheese', 60.00, 'Regular', 50, true);
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v10_id, 'Combos', 'Meals') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v10_id, mc_id, 'Burger & Fries Combo', 'Burger with fries and drink', 85.00, 'Large', 40, true);

    -- Green Valley Organics (Vendor 11)
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v11_id, 'Fresh Veggies', 'Organic vegetables') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v11_id, mc_id, 'Organic Carrots', 'Farm fresh carrots', 25.00, '1kg', 60, true);
    INSERT INTO menu_categories (vendor_id, name, description) VALUES (v11_id, 'Fruits', 'Organic fruits') RETURNING id INTO mc_id;
    INSERT INTO menu_items (vendor_id, menu_category_id, name, description, price, size, quantity, is_in_stock) VALUES 
    (v11_id, mc_id, 'Organic Apples', 'Crisp organic apples', 35.00, '1kg', 45, true);

END $$;
