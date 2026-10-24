ALTER TABLE artist_accounts ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
