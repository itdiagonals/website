package migrations

import "gorm.io/gorm"

var migration0008InitStockReservationsTable = Migration{
	Version:     "0008_init_stock_reservations_table",
	Description: "Create stock_reservations table for checkout stock safety",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`CREATE TABLE IF NOT EXISTS stock_reservations (
				id BIGSERIAL PRIMARY KEY,
				order_id VARCHAR(100) NOT NULL,
				product_id INTEGER NOT NULL,
				quantity INTEGER NOT NULL,
				status VARCHAR(20) NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`,
			`CREATE UNIQUE INDEX IF NOT EXISTS uidx_stock_reservations_order_product ON stock_reservations(order_id, product_id)`,
			`CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_id ON stock_reservations(order_id)`,
			`CREATE INDEX IF NOT EXISTS idx_stock_reservations_status ON stock_reservations(status)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
