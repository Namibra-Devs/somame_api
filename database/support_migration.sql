-- Migration: Create support system tables
CREATE TABLE IF NOT EXISTS support_cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    parcel_order_id INTEGER REFERENCES parcel_orders(id) ON DELETE SET NULL,
    subject VARCHAR(255),
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    priority VARCHAR(50) DEFAULT 'medium',
    assigned_agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_cases_user_id ON support_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_case_number ON support_cases(case_number);
CREATE INDEX IF NOT EXISTS idx_support_cases_order_id ON support_cases(order_id);

CREATE TABLE IF NOT EXISTS support_messages (
    id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES support_cases(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sender_type VARCHAR(50) NOT NULL, -- 'system', 'customer', 'agent', 'admin'
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_messages_case_id ON support_messages(case_id);

CREATE TABLE IF NOT EXISTS support_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Orders', 'Payments', 'Delivery', 'Account', 'General'
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial sample help articles
INSERT INTO support_articles (title, category, content) VALUES
('How do I track my order in real-time?', 'Orders', 'You can track your order directly from the order details screen or by clicking "Track my order" on your active order screen.'),
('What should I do if an item is missing?', 'Orders', 'If an item is missing from your delivery, please select the order from the Support menu and start a chat with our support team.'),
('Accepted payment methods', 'Payments', 'We accept Mobile Money (MTN MoMo, Telecel Cash, AirtelTigo Money) and debit/credit cards.'),
('How does parcel delivery work?', 'Delivery', 'Select Parcels from the services list, enter the pickup and dropoff locations, specify the item details, and request a rider.');
