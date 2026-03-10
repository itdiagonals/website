package migrations

import "gorm.io/gorm"

var migration0005InitCatalogSyncProcessedEvents = Migration{
	Version:     "0005_init_catalog_sync_processed_events",
	Description: "Create catalog sync processed events table",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`CREATE TABLE IF NOT EXISTS catalog_sync_processed_events (
				event_id VARCHAR(128) PRIMARY KEY,
				collection VARCHAR(100) NOT NULL,
				operation VARCHAR(32) NOT NULL,
				document_id BIGINT NOT NULL,
				occurred_at TIMESTAMPTZ,
				processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`,
			`CREATE INDEX IF NOT EXISTS idx_catalog_sync_processed_document ON catalog_sync_processed_events(collection, document_id)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
