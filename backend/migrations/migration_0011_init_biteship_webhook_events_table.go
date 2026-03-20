package migrations

import "gorm.io/gorm"

var migration0011InitBiteshipWebhookEventsTable = Migration{
	Version:     "0011_init_biteship_webhook_events_table",
	Description: "Create biteship webhook events table for idempotency",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`CREATE TABLE IF NOT EXISTS biteship_webhook_events (
				id BIGSERIAL PRIMARY KEY,
				event_key VARCHAR(80) NOT NULL UNIQUE,
				event_type VARCHAR(80) NOT NULL,
				order_id VARCHAR(120),
				status VARCHAR(80),
				waybill_id VARCHAR(120),
				received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`,
			`CREATE INDEX IF NOT EXISTS idx_biteship_webhook_events_event_type ON biteship_webhook_events(event_type)`,
			`CREATE INDEX IF NOT EXISTS idx_biteship_webhook_events_order_id ON biteship_webhook_events(order_id)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
