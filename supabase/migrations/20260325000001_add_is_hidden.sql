-- Add is_hidden column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
