-- Run this script in pgAdmin4 to add the is_open flag to vendors

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
