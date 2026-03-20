package migrations

import "gorm.io/gorm"

var migration0012InitShippingJobsTable = Migration{
	Version:     "0012_init_shipping_jobs_table",
	Description: "Create shipping jobs table for async booking",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`CREATE TABLE IF NOT EXISTS shipping_jobs (
				id BIGSERIAL PRIMARY KEY,
				job_type VARCHAR(50) NOT NULL,
				order_id VARCHAR(120) NOT NULL,
				status VARCHAR(30) NOT NULL,
				attempts INT NOT NULL DEFAULT 0,
				max_attempts INT NOT NULL DEFAULT 8,
				next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				locked_at TIMESTAMPTZ NULL,
				last_error TEXT NOT NULL DEFAULT '',
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT uq_shipping_jobs_job_type_order_id UNIQUE (job_type, order_id)
			)`,
			`CREATE INDEX IF NOT EXISTS idx_shipping_jobs_status_next_run_at ON shipping_jobs(status, next_run_at)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
