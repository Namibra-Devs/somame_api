-- Run this script in pgAdmin4 to link vendors to their respective user accounts.
-- WARNING: Since you confirmed there are no vendors yet, we can safely apply NOT NULL.
-- If you did have vendors, you would need to set a default user_id or handle NULLs.

ALTER TABLE vendors
ADD COLUMN user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE;
