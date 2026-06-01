-- Run this script in pgAdmin4 to add new payment methods to your existing enum

ALTER TYPE payment_method_type ADD VALUE IF NOT EXISTS 'namibrapay';
ALTER TYPE payment_method_type ADD VALUE IF NOT EXISTS 'stripe';
