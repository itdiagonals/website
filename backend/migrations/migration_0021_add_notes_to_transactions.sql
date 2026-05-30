-- migration: 0021_add_notes_to_transactions
-- description: Add notes column to transactions table

-- up
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- down
ALTER TABLE transactions DROP COLUMN IF EXISTS notes;
