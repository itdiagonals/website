package migrations

import "gorm.io/gorm"

var migration0004InitCatalogReadModelTables = Migration{
	Version:     "0004_init_catalog_read_model_tables",
	Description: "Create backend-owned catalog read model tables",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`CREATE TABLE IF NOT EXISTS catalog_media (
				id BIGINT PRIMARY KEY,
				alt VARCHAR(255) NOT NULL,
				url TEXT NOT NULL,
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`,
			`CREATE TABLE IF NOT EXISTS catalog_categories (
				id BIGINT PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				slug VARCHAR(255) NOT NULL UNIQUE,
				cover_image_id BIGINT,
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`,
			`CREATE INDEX IF NOT EXISTS idx_catalog_categories_slug ON catalog_categories(slug)`,
			`CREATE TABLE IF NOT EXISTS catalog_seasons (
				id BIGINT PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				slug VARCHAR(255) NOT NULL UNIQUE,
				subtitle VARCHAR(255),
				description TEXT,
				cover_image_id BIGINT,
				is_active BOOLEAN NOT NULL DEFAULT TRUE,
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`,
			`CREATE INDEX IF NOT EXISTS idx_catalog_seasons_slug ON catalog_seasons(slug)`,
			`CREATE TABLE IF NOT EXISTS catalog_season_lookbook_images (
				season_id BIGINT NOT NULL,
				image_id BIGINT NOT NULL,
				sort_order INTEGER NOT NULL DEFAULT 0,
				PRIMARY KEY (season_id, sort_order)
			)`,
			`CREATE TABLE IF NOT EXISTS catalog_care_guides (
				id BIGINT PRIMARY KEY,
				title VARCHAR(255) NOT NULL,
				instructions JSONB,
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`,
			`CREATE TABLE IF NOT EXISTS catalog_products (
				id BIGINT PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				slug VARCHAR(255) NOT NULL UNIQUE,
				category_id BIGINT NOT NULL,
				season_id BIGINT NOT NULL,
				care_guide_id BIGINT,
				gender VARCHAR(50) NOT NULL,
				base_price NUMERIC(15,2) NOT NULL,
				stock INTEGER NOT NULL,
				description TEXT,
				detail_info JSONB,
				cover_image_id BIGINT,
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`,
			`CREATE INDEX IF NOT EXISTS idx_catalog_products_slug ON catalog_products(slug)`,
			`CREATE INDEX IF NOT EXISTS idx_catalog_products_category_id ON catalog_products(category_id)`,
			`CREATE INDEX IF NOT EXISTS idx_catalog_products_season_id ON catalog_products(season_id)`,
			`CREATE TABLE IF NOT EXISTS catalog_product_gallery (
				product_id BIGINT NOT NULL,
				image_id BIGINT NOT NULL,
				sort_order INTEGER NOT NULL DEFAULT 0,
				PRIMARY KEY (product_id, sort_order)
			)`,
			`CREATE TABLE IF NOT EXISTS catalog_product_colors (
				product_id BIGINT NOT NULL,
				color_name VARCHAR(100) NOT NULL,
				hex_code VARCHAR(20) NOT NULL,
				sort_order INTEGER NOT NULL DEFAULT 0,
				PRIMARY KEY (product_id, sort_order)
			)`,
			`CREATE TABLE IF NOT EXISTS catalog_product_sizes (
				product_id BIGINT NOT NULL,
				size VARCHAR(50) NOT NULL,
				sort_order INTEGER NOT NULL DEFAULT 0,
				PRIMARY KEY (product_id, sort_order)
			)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
