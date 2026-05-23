package migrations

import "gorm.io/gorm"

var migration0013InitPayloadTables = Migration{
	Version:     "0013_init_payload_tables",
	Description: "Create Payload CMS-owned tables (users, media, categories, seasons, care_guides, products, product sub-tables, season_lookbook_images)",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			// ── Users (Payload auth collection + app users) ──
			`CREATE TABLE IF NOT EXISTS users (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				email VARCHAR(255) NOT NULL UNIQUE,
				password VARCHAR(255),
				name VARCHAR(255),
				role VARCHAR(50) NOT NULL DEFAULT 'user',
				phone VARCHAR(50),
				address TEXT,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`,

			// ── Media (upload collection) ──
			`CREATE TABLE IF NOT EXISTS media (
				id SERIAL PRIMARY KEY,
				alt VARCHAR(255) NOT NULL,
				url TEXT NOT NULL,
				filename VARCHAR(255) NOT NULL,
				mime_type VARCHAR(255),
				filesize BIGINT,
				width INT,
				height INT,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`,

			// ── Categories ──
			`CREATE TABLE IF NOT EXISTS categories (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				slug VARCHAR(255) NOT NULL UNIQUE,
				cover_image_id INT,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_categories_cover_image FOREIGN KEY (cover_image_id)
					REFERENCES media(id) ON UPDATE CASCADE ON DELETE SET NULL
			)`,
			`CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`,

			// ── Seasons ──
			`CREATE TABLE IF NOT EXISTS seasons (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				slug VARCHAR(255) NOT NULL UNIQUE,
				subtitle TEXT,
				description TEXT,
				cover_image_id INT,
				is_active BOOLEAN NOT NULL DEFAULT TRUE,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_seasons_cover_image FOREIGN KEY (cover_image_id)
					REFERENCES media(id) ON UPDATE CASCADE ON DELETE SET NULL
			)`,
			`CREATE INDEX IF NOT EXISTS idx_seasons_slug ON seasons(slug)`,

			// ── Season ↔ Media many-to-many for lookbook_images ──
			`CREATE TABLE IF NOT EXISTS season_lookbook_images (
				season_id INT NOT NULL,
				media_id INT NOT NULL,
				PRIMARY KEY (season_id, media_id),
				CONSTRAINT fk_sli_season FOREIGN KEY (season_id)
					REFERENCES seasons(id) ON UPDATE CASCADE ON DELETE CASCADE,
				CONSTRAINT fk_sli_media FOREIGN KEY (media_id)
					REFERENCES media(id) ON UPDATE CASCADE ON DELETE CASCADE
			)`,

			// ── Care Guides ──
			`CREATE TABLE IF NOT EXISTS care_guides (
				id SERIAL PRIMARY KEY,
				title VARCHAR(255) NOT NULL,
				instructions JSONB,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`,

			// ── Products ──
			`CREATE TABLE IF NOT EXISTS products (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				slug VARCHAR(255) NOT NULL UNIQUE,
				season_id INT,
				category_id INT,
				gender VARCHAR(50) NOT NULL DEFAULT 'unisex',
				base_price NUMERIC(15,2) NOT NULL,
				weight INT NOT NULL DEFAULT 0,
				length INT NOT NULL DEFAULT 0,
				width INT NOT NULL DEFAULT 0,
				height INT NOT NULL DEFAULT 0,
				stock INT NOT NULL DEFAULT 0,
				description TEXT,
				cover_image_id INT,
				care_guide_id INT,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_products_season FOREIGN KEY (season_id)
					REFERENCES seasons(id) ON UPDATE CASCADE ON DELETE SET NULL,
				CONSTRAINT fk_products_category FOREIGN KEY (category_id)
					REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
				CONSTRAINT fk_products_cover_image FOREIGN KEY (cover_image_id)
					REFERENCES media(id) ON UPDATE CASCADE ON DELETE SET NULL,
				CONSTRAINT fk_products_care_guide FOREIGN KEY (care_guide_id)
					REFERENCES care_guides(id) ON UPDATE CASCADE ON DELETE SET NULL
			)`,
			`CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)`,
			`CREATE INDEX IF NOT EXISTS idx_products_season_id ON products(season_id)`,
			`CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)`,

			// ── Products: Available Colors (array sub-table) ──
			`CREATE TABLE IF NOT EXISTS products_available_colors (
				id SERIAL PRIMARY KEY,
				_parent_id INT NOT NULL,
				_order INT,
				color_name VARCHAR(255) NOT NULL,
				hex_code VARCHAR(20) NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_pac_parent FOREIGN KEY (_parent_id)
					REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE
			)`,
			`CREATE INDEX IF NOT EXISTS idx_pac_parent_id ON products_available_colors(_parent_id)`,

			// ── Products: Available Sizes (array sub-table) ──
			`CREATE TABLE IF NOT EXISTS products_available_sizes (
				id SERIAL PRIMARY KEY,
				_parent_id INT NOT NULL,
				_order INT,
				size VARCHAR(100) NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_pas_parent FOREIGN KEY (_parent_id)
					REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE
			)`,
			`CREATE INDEX IF NOT EXISTS idx_pas_parent_id ON products_available_sizes(_parent_id)`,

			// ── Products: Gallery (array sub-table) ──
			`CREATE TABLE IF NOT EXISTS products_gallery (
				id SERIAL PRIMARY KEY,
				_parent_id INT NOT NULL,
				_order INT,
				image_id INT NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_pg_parent FOREIGN KEY (_parent_id)
					REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
				CONSTRAINT fk_pg_image FOREIGN KEY (image_id)
					REFERENCES media(id) ON UPDATE CASCADE ON DELETE CASCADE
			)`,
			`CREATE INDEX IF NOT EXISTS idx_pg_parent_id ON products_gallery(_parent_id)`,

			// ── Products: Variants (array sub-table) ──
			`CREATE TABLE IF NOT EXISTS products_variants (
				id SERIAL PRIMARY KEY,
				_parent_id INT NOT NULL,
				_order INT,
				color_name VARCHAR(255) NOT NULL,
				size VARCHAR(100) NOT NULL,
				stock INT NOT NULL DEFAULT 0,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_pv_parent FOREIGN KEY (_parent_id)
					REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE
			)`,
			`CREATE INDEX IF NOT EXISTS idx_pv_parent_id ON products_variants(_parent_id)`,

			// ── Add FKs now that users table exists ──
			`DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_transactions_user') THEN
					ALTER TABLE transactions ADD CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
				END IF;
			END $$`,
			`DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_carts_user') THEN
					ALTER TABLE carts ADD CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
				END IF;
			END $$`,
			`DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_auth_sessions_user') THEN
					ALTER TABLE auth_sessions ADD CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
				END IF;
			END $$`,
			`DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_user_addresses_user') THEN
					ALTER TABLE user_addresses ADD CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
				END IF;
			END $$`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
