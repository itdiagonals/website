package migrations

import "gorm.io/gorm"

var migration0015DropAuthSessionsTable = Migration{
	Version:     "0015_drop_auth_sessions_table",
	Description: "Drop auth_sessions table (moved to Redis)",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`ALTER TABLE auth_sessions DROP CONSTRAINT IF EXISTS fk_auth_sessions_user`,
			`DROP TABLE IF EXISTS auth_sessions`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
