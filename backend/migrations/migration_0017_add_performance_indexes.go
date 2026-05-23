package migrations

import "gorm.io/gorm"

var migration0017AddPerformanceIndexes = Migration{
	Version:     "0017_add_performance_indexes",
	Description: "Add missing performance indexes on frequently queried columns",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`,
			`CREATE INDEX IF NOT EXISTS idx_transactions_shipping_status ON transactions(shipping_status)`,
			`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC)`,
			`CREATE INDEX IF NOT EXISTS idx_transactions_user_id_status ON transactions(user_id, status)`,
			`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
			`CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender)`,
			`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`,
			`CREATE INDEX IF NOT EXISTS idx_seasons_is_active ON seasons(is_active)`,
			`CREATE INDEX IF NOT EXISTS idx_biteship_webhook_events_status ON biteship_webhook_events(status)`,
			`CREATE INDEX IF NOT EXISTS idx_shipping_jobs_order_id ON shipping_jobs(order_id)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
