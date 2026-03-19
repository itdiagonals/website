package migrations

import "gorm.io/gorm"

var migration0007AlterCustomerAddressesForGeolocation = Migration{
	Version:     "0007_alter_customer_addresses_for_geolocation",
	Description: "Add geolocation and destination area metadata to customer addresses",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7)`,
			`ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7)`,
			`ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS place_id VARCHAR(255)`,
			`ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS map_provider VARCHAR(50)`,
			`ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS location_source VARCHAR(50)`,
			`ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS destination_area_id VARCHAR(64)`,
			`ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS destination_area_label VARCHAR(255)`,
			`CREATE INDEX IF NOT EXISTS idx_customer_addresses_destination_area_id ON customer_addresses(destination_area_id)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
