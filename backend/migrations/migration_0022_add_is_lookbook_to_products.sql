-- migration: 0022_add_is_lookbook_to_products
-- description: Add is_lookbook flag to products table

-- up
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_lookbook BOOLEAN NOT NULL DEFAULT FALSE;

-- down
ALTER TABLE products DROP COLUMN IF EXISTS is_lookbook;
