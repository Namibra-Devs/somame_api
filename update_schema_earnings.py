with open('c:/xampp/htdocs/somame_api/database/schema.sql', 'a', encoding='utf-8') as f:
    f.write('''
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
''')

print("Updated schema.sql successfully")
