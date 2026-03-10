package migrations

import "gorm.io/gorm"

var migration0003InitAuthSessionsTable = Migration{
	Version:     "0003_init_auth_sessions_table",
	Description: "Create auth_sessions table",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`CREATE TABLE IF NOT EXISTS auth_sessions (
				id VARCHAR(64) PRIMARY KEY,
				customer_id BIGINT NOT NULL,
				refresh_token_hash TEXT NOT NULL,
				user_agent TEXT,
				ip_address VARCHAR(255),
				device_name VARCHAR(255),
				last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				expires_at TIMESTAMPTZ NOT NULL,
				revoked_at TIMESTAMPTZ,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				CONSTRAINT fk_auth_sessions_customer FOREIGN KEY (customer_id)
					REFERENCES customers(id)
					ON UPDATE CASCADE
					ON DELETE CASCADE
			)`,
			`CREATE INDEX IF NOT EXISTS idx_auth_sessions_customer_id ON auth_sessions(customer_id)`,
			`CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at)`,
			`CREATE INDEX IF NOT EXISTS idx_auth_sessions_revoked_at ON auth_sessions(revoked_at)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
