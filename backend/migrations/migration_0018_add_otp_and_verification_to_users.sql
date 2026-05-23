-- migration: 0018_add_otp_and_verification_to_users
-- description: Add otp_code and is_verified columns to users table

-- up
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- down
ALTER TABLE users DROP COLUMN IF EXISTS otp_code;
ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
