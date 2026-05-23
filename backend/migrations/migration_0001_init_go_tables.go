package migrations

import "gorm.io/gorm"

var migration0001InitGoTables = Migration{
	Version:     "0001_init_go_tables",
	Description: "Create transactions and transaction_items tables",
	Up: func(tx *gorm.DB) error {
		statements := []string{
		`CREATE TABLE IF NOT EXISTS transactions (
			id BIGSERIAL PRIMARY KEY,
			order_id VARCHAR(100) NOT NULL UNIQUE,
			user_id UUID NOT NULL,
			total_amount NUMERIC(15,2) NOT NULL,
			status VARCHAR(50) NOT NULL,
			snap_token TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`,
			`CREATE TABLE IF NOT EXISTS transaction_items (
				id BIGSERIAL PRIMARY KEY,
				transaction_id BIGINT NOT NULL,
				product_id INTEGER NOT NULL,
				quantity INTEGER NOT NULL,
				price NUMERIC(15,2) NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_transaction_items_transaction FOREIGN KEY (transaction_id)
					REFERENCES transactions(id)
					ON UPDATE CASCADE
					ON DELETE CASCADE
			)`,
			`CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id)`,
			`CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
