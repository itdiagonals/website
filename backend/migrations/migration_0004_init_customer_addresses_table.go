package migrations

import "gorm.io/gorm"

var migration0004InitCustomerAddressesTable = Migration{
	Version:     "0004_init_customer_addresses_table",
	Description: "Create customer_addresses table",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`CREATE TABLE IF NOT EXISTS customer_addresses (
				id BIGSERIAL PRIMARY KEY,
				customer_id BIGINT NOT NULL,
				title VARCHAR(100) NOT NULL,
				recipient_name VARCHAR(255) NOT NULL,
				phone_number VARCHAR(50) NOT NULL,
				province VARCHAR(255) NOT NULL,
				city VARCHAR(255) NOT NULL,
				district VARCHAR(255) NOT NULL,
				village VARCHAR(255) NOT NULL,
				postal_code VARCHAR(20) NOT NULL,
				full_address TEXT NOT NULL,
				is_primary BOOLEAN NOT NULL DEFAULT FALSE,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_customer_addresses_customer FOREIGN KEY (customer_id)
					REFERENCES customers(id)
					ON UPDATE CASCADE
					ON DELETE CASCADE
			)`,
			`CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id)`,
			`CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_addresses_primary_per_customer ON customer_addresses(customer_id) WHERE is_primary = TRUE`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
