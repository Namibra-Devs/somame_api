-- Create job_declines table
CREATE TABLE job_declines (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    rider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_order_decline UNIQUE (order_number, rider_id)
);

CREATE INDEX idx_job_declines_order_number ON job_declines(order_number);
CREATE INDEX idx_job_declines_rider_id ON job_declines(rider_id);
