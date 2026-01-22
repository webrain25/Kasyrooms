-- Initialize full HYBRID schema for Neon/Postgres.
-- Creates both:
-- - Legacy/local tables (users/models/user_profiles/wallets/...) using varchar app-generated PKs
-- - Sirplay/canonical tables (accounts/wallet_snapshots/wallet_transactions)
--
-- Idempotent: safe to run multiple times.
-- Note: wallet_snapshots.account_id and wallet_transactions.account_id intentionally have NO FK.

BEGIN;

-- =========================
-- Legacy / Local domain
-- =========================

CREATE TABLE IF NOT EXISTS public.users (
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

CREATE TABLE IF NOT EXISTS public.models (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  age integer NOT NULL,
  country text NOT NULL,
  languages text[] NOT NULL,
  specialties text[] NOT NULL,
  is_online boolean DEFAULT false,
  is_busy boolean DEFAULT false,
  is_new boolean DEFAULT false,
  rating integer DEFAULT 0,
  viewer_count integer DEFAULT 0,
  profile_image text NOT NULL,
  private_shows integer DEFAULT 0,
  hours_online integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id varchar PRIMARY KEY,
  first_name text,
  last_name text,
  birth_date date,
  created_at timestamp DEFAULT now(),
  CONSTRAINT user_profiles_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.wallets (
  user_id varchar PRIMARY KEY,
  balance_cents integer NOT NULL DEFAULT 0,
  currency varchar(8) NOT NULL DEFAULT 'EUR',
  created_at timestamp DEFAULT now(),
  CONSTRAINT wallets_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.cards (
  id varchar PRIMARY KEY,
  user_id varchar NOT NULL,
  brand text,
  last4 varchar(4),
  exp_month integer,
  exp_year integer,
  created_at timestamp DEFAULT now(),
  CONSTRAINT cards_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.model_ratings (
  model_id bigint NOT NULL,
  user_id varchar NOT NULL,
  stars integer NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT model_ratings_pk PRIMARY KEY (model_id, user_id),
  CONSTRAINT model_ratings_model_fk FOREIGN KEY (model_id) REFERENCES public.models(id),
  CONSTRAINT model_ratings_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id varchar PRIMARY KEY,
  user_id_b varchar,
  user_id_a varchar,
  type varchar(24) NOT NULL,
  amount_cents integer NOT NULL,
  currency varchar(8) NOT NULL DEFAULT 'EUR',
  source text,
  external_ref text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id varchar PRIMARY KEY,
  user_id_b varchar NOT NULL,
  model_id bigint NOT NULL,
  started_at timestamp DEFAULT now(),
  ended_at timestamp,
  duration_sec integer DEFAULT 0,
  total_charged_cents integer DEFAULT 0,
  CONSTRAINT sessions_user_fk FOREIGN KEY (user_id_b) REFERENCES public.users(id),
  CONSTRAINT sessions_model_fk FOREIGN KEY (model_id) REFERENCES public.models(id)
);

CREATE TABLE IF NOT EXISTS public.dmca_notices (
  id varchar PRIMARY KEY,
  reporter_name text NOT NULL,
  reporter_email text NOT NULL,
  original_content_url text NOT NULL,
  infringing_urls text[] NOT NULL,
  signature text NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'open',
  notes text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kyc_applications (
  id varchar PRIMARY KEY,
  user_id varchar,
  full_name text NOT NULL,
  date_of_birth date,
  country text,
  document_type varchar(32),
  document_front_url text,
  document_back_url text,
  selfie_url text,
  status varchar(16) NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp DEFAULT now(),
  CONSTRAINT kyc_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id varchar PRIMARY KEY,
  "when" timestamp DEFAULT now(),
  actor varchar(64),
  role varchar(16),
  action varchar(64) NOT NULL,
  target text,
  meta text
);

-- Helpful indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_users_external_user_id ON public.users (external_user_id);
CREATE INDEX IF NOT EXISTS idx_users_sirplay_user_id ON public.users (sirplay_user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_b ON public.transactions (user_id_b);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_b ON public.sessions (user_id_b);
CREATE INDEX IF NOT EXISTS idx_sessions_model_id ON public.sessions (model_id);

-- =========================
-- Sirplay / Canonical domain
-- =========================

CREATE TABLE IF NOT EXISTS public.accounts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  role text NOT NULL DEFAULT 'user',
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  external_provider text,
  external_user_id text
);

CREATE TABLE IF NOT EXISTS public.wallet_snapshots (
  account_id bigint PRIMARY KEY,
  provider text NOT NULL DEFAULT 'sirplay',
  balance_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id bigserial PRIMARY KEY,
  account_id bigint NOT NULL,
  provider text NOT NULL DEFAULT 'sirplay',
  external_transaction_id text,
  type text NOT NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'confirmed',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_wallet_tx_provider_extid
  ON public.wallet_transactions (provider, external_transaction_id);

CREATE INDEX IF NOT EXISTS idx_accounts_external_user_id ON public.accounts (external_user_id);

COMMIT;
