-- Run this script in pgAdmin4 to add the tags column to vendors table

ALTER TABLE vendors 
ADD COLUMN tags VARCHAR(255);
