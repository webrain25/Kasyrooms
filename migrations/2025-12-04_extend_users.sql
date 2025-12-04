-- Extend users table with new fields (idempotent)
-- Requires PostgreSQL

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Ensure external_user_id exists (for safety in older DBs)
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS external_user_id TEXT;

-- Optional: add simple index for lookups by external_user_id
CREATE INDEX IF NOT EXISTS idx_users_external_user_id ON users(external_user_id);

-- Optional: add unique constraint on username if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_username_unique'
  ) THEN
    BEGIN
      ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
    EXCEPTION WHEN duplicate_object THEN
      -- Constraint may already exist under a different name; ignore
      NULL;
    END;
  END IF;
END $$;
