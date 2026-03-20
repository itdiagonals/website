package migrations

import "gorm.io/gorm"

var migration0010AlterTransactionsForBiteshipOrderFields = Migration{
	Version:     "0010_alter_transactions_for_biteship_order_fields",
	Description: "Add Biteship order metadata columns to transactions table",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS biteship_order_id VARCHAR(100)`,
			`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS biteship_reference_id VARCHAR(120)`,
			`CREATE INDEX IF NOT EXISTS idx_transactions_biteship_order_id ON transactions(biteship_order_id)`,
			`CREATE INDEX IF NOT EXISTS idx_transactions_biteship_reference_id ON transactions(biteship_reference_id)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
