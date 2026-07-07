with open('c:/xampp/htdocs/somame_api/database/schema.sql', 'a', encoding='utf-8') as f:
    f.write('''
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
''')

print("Updated schema.sql successfully")
