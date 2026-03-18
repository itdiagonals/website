package migrations

import "gorm.io/gorm"

var migration0006AlterTransactionsForLogisticsAndPayment = Migration{
	Version:     "0006_alter_transactions_for_logistics_and_payment",
	Description: "Add shipping and payment detail columns to transactions table",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shipping_address_id BIGINT`,
			`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100) NOT NULL DEFAULT ''`,
			`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS courier_service VARCHAR(100) NOT NULL DEFAULT ''`,
			`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(15,2) NOT NULL DEFAULT 0`,
			`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100)`,
			`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(50) NOT NULL DEFAULT 'pending'`,
			`CREATE INDEX IF NOT EXISTS idx_transactions_shipping_address_id ON transactions(shipping_address_id)`,
			`DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT 1
					FROM pg_constraint
					WHERE conname = 'fk_transactions_shipping_address'
				) THEN
					ALTER TABLE transactions
					ADD CONSTRAINT fk_transactions_shipping_address
					FOREIGN KEY (shipping_address_id)
					REFERENCES customer_addresses(id)
					ON UPDATE CASCADE
					ON DELETE RESTRICT;
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
