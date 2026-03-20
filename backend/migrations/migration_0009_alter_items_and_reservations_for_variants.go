package migrations

import "gorm.io/gorm"

var migration0009AlterItemsAndReservationsForVariants = Migration{
	Version:     "0009_alter_items_and_reservations_for_variants",
	Description: "Add variant fields to transaction_items and stock_reservations",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS selected_size VARCHAR(100) NOT NULL DEFAULT ''`,
			`ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS selected_color_name VARCHAR(100) NOT NULL DEFAULT ''`,
			`ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS selected_color_hex VARCHAR(20)`,
			`ALTER TABLE stock_reservations ADD COLUMN IF NOT EXISTS selected_size VARCHAR(100) NOT NULL DEFAULT ''`,
			`ALTER TABLE stock_reservations ADD COLUMN IF NOT EXISTS selected_color_name VARCHAR(100) NOT NULL DEFAULT ''`,
			`DROP INDEX IF EXISTS uidx_stock_reservations_order_product`,
			`CREATE UNIQUE INDEX IF NOT EXISTS uidx_stock_reservations_order_variant ON stock_reservations(order_id, product_id, selected_size, selected_color_name)`,
			`CREATE INDEX IF NOT EXISTS idx_stock_reservations_variant ON stock_reservations(product_id, selected_size, selected_color_name)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
