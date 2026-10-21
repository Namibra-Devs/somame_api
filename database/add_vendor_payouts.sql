-- 29. vendor_payment_methods table
CREATE TABLE IF NOT EXISTS vendor_payment_methods (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('momo', 'bank')),
    network_or_bank VARCHAR(100) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    branch VARCHAR(255),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_payment_methods_vendor_id ON vendor_payment_methods(vendor_id);

-- 30. vendor_payouts table
CREATE TABLE IF NOT EXISTS vendor_payouts (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method_id INTEGER REFERENCES vendor_payment_methods(id) ON DELETE SET NULL,
    method_label VARCHAR(100) NOT NULL,
    account_masked VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Paid',
    reference_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON vendor_payouts(vendor_id);
