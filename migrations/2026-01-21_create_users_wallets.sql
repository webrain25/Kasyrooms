-- Create minimal local auth schema for Neon/Postgres.
-- Idempotent: safe to run multiple times.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  email text,
  role varchar(16) DEFAULT 'user',
  external_provider text,
  external_user_id text,
  sirplay_user_id text,
  sirplay_customer_id text,
  first_name text,
  last_name text,
  dob date,
  country text,
  phone_number text,
  status varchar(16) DEFAULT 'active',
  last_login timestamp,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id varchar PRIMARY KEY,
  first_name text,
  last_name text,
  birth_date date,
  created_at timestamp DEFAULT now(),
  CONSTRAINT user_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id varchar PRIMARY KEY,
  balance_cents integer NOT NULL DEFAULT 0,
  currency varchar(8) NOT NULL DEFAULT 'EUR',
  created_at timestamp DEFAULT now(),
  CONSTRAINT wallets_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

COMMIT;
