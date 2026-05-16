package migrations

import "gorm.io/gorm"

var migration0014UnifyUsersCustomers = Migration{
	Version:     "0014_unify_users_customers",
	Description: "Unify users and customers tables into a single users table with role field",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`,
			`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`,
			`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'`,

			`DO $$ BEGIN
				IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
					INSERT INTO users (id, email, password, name, role, phone, address, created_at, updated_at)
					SELECT id, email, password_hash, name, 'customer', phone, address, created_at, updated_at
					FROM customers
					ON CONFLICT (email) DO NOTHING;

					ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_customer;
					ALTER TABLE carts DROP CONSTRAINT IF EXISTS fk_carts_customer;
					ALTER TABLE auth_sessions DROP CONSTRAINT IF EXISTS fk_auth_sessions_customer;
					ALTER TABLE customer_addresses DROP CONSTRAINT IF EXISTS fk_customer_addresses_customer;

					ALTER TABLE transactions RENAME COLUMN customer_id TO user_id;
					ALTER TABLE carts RENAME COLUMN customer_id TO user_id;
					ALTER TABLE auth_sessions RENAME COLUMN customer_id TO user_id;
					ALTER TABLE customer_addresses RENAME COLUMN customer_id TO user_id;

					ALTER TABLE customer_addresses RENAME TO user_addresses;

					DROP TABLE IF EXISTS customers;
				END IF;
			END $$`,

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
				IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_auth_sessions_user') THEN
					ALTER TABLE auth_sessions ADD CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
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
