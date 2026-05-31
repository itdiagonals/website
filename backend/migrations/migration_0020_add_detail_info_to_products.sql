-- migration: 0020_add_detail_info_to_products
-- description: Add detail_info JSONB column to products table

-- up
ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_info JSONB;

-- down
ALTER TABLE products DROP COLUMN IF EXISTS detail_info;
