-- migration: 0019_add_draft_id_to_media
-- description: Add draft_id column to media table for draft media support

-- up
ALTER TABLE media ADD COLUMN IF NOT EXISTS draft_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_media_draft_id ON media(draft_id);

-- down
ALTER TABLE media DROP COLUMN IF EXISTS draft_id;
