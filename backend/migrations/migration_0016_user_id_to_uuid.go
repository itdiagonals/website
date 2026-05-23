package migrations

import "gorm.io/gorm"

var migration0016UserIDToUUID = Migration{
	Version:     "0016_user_id_to_uuid",
	Description: "Change user_id columns and users.id from BIGINT to UUID",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			// Drop FK constraints first
			`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_user`,
			`ALTER TABLE carts DROP CONSTRAINT IF EXISTS fk_carts_user`,
			`ALTER TABLE user_addresses DROP CONSTRAINT IF EXISTS fk_user_addresses_user`,

			// Alter users.id to UUID (deterministic mapping from bigint)
			`DO $$ BEGIN
				IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'bigint') THEN
					ALTER TABLE users ALTER COLUMN id TYPE UUID USING (lpad(to_hex(id::bigint), 32, '0')::uuid);
				END IF;
			END $$`,

			// Alter user_id columns to UUID
			`DO $$ BEGIN
				IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id' AND data_type = 'bigint') THEN
					ALTER TABLE transactions ALTER COLUMN user_id TYPE UUID USING (lpad(to_hex(user_id::bigint), 32, '0')::uuid);
				END IF;
			END $$`,

			`DO $$ BEGIN
				IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carts' AND column_name = 'user_id' AND data_type = 'bigint') THEN
					ALTER TABLE carts ALTER COLUMN user_id TYPE UUID USING (lpad(to_hex(user_id::bigint), 32, '0')::uuid);
				END IF;
			END $$`,

			`DO $$ BEGIN
				IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_addresses' AND column_name = 'user_id' AND data_type = 'bigint') THEN
					ALTER TABLE user_addresses ALTER COLUMN user_id TYPE UUID USING (lpad(to_hex(user_id::bigint), 32, '0')::uuid);
				END IF;
			END $$`,

			// Recreate FK constraints
			`DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_transactions_user') THEN
					ALTER TABLE transactions ADD CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
				END IF;
			END $$`,
			`DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_carts_user') THEN
					ALTER TABLE carts ADD CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
				END IF;
			END $$`,
			`DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_user_addresses_user') THEN
					ALTER TABLE user_addresses ADD CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
				END IF;
			END $$`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		return nil
	},
}
