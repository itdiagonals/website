package migrations

import "gorm.io/gorm"

var migration0002InitCartTables = Migration{
	Version:     "0002_init_cart_tables",
	Description: "Create carts and cart_items tables",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`CREATE TABLE IF NOT EXISTS carts (
				id BIGSERIAL PRIMARY KEY,
				customer_id BIGINT NOT NULL UNIQUE,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_carts_customer FOREIGN KEY (customer_id)
					REFERENCES customers(id)
					ON UPDATE CASCADE
					ON DELETE CASCADE
			)`,
			`CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id)`,
			`CREATE TABLE IF NOT EXISTS cart_items (
				id BIGSERIAL PRIMARY KEY,
				cart_id BIGINT NOT NULL,
				product_id INTEGER NOT NULL,
				product_name_snapshot VARCHAR(255) NOT NULL,
				gender_snapshot VARCHAR(50),
				image_url_snapshot TEXT,
				base_price_snapshot NUMERIC(15,2) NOT NULL,
				quantity INTEGER NOT NULL,
				selected_size VARCHAR(100) NOT NULL,
				selected_color_name VARCHAR(100) NOT NULL,
				selected_color_hex VARCHAR(20),
				selected_color_value VARCHAR(100),
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id)
					REFERENCES carts(id)
					ON UPDATE CASCADE
					ON DELETE CASCADE,
				CONSTRAINT uq_cart_items_variant UNIQUE (cart_id, product_id, selected_size, selected_color_name, selected_color_hex)
			)`,
			`CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id)`,
			`CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
