-- DEV patch: create missing legacy/local tables for HYBRID mode.
-- Non-destructive: only CREATE TABLE/INDEX IF NOT EXISTS.
-- IMPORTANT: does NOT touch existing tables: users, models, accounts, wallet_snapshots, wallet_transactions.

BEGIN;

-- user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id varchar PRIMARY KEY,
  first_name text,
  last_name text,
  birth_date date,
  created_at timestamp DEFAULT now(),
  CONSTRAINT user_profiles_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id varchar PRIMARY KEY,
  balance_cents integer NOT NULL DEFAULT 0,
  currency varchar(8) NOT NULL DEFAULT 'EUR',
  created_at timestamp DEFAULT now(),
  CONSTRAINT wallets_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- cards
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
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards (user_id);

-- model_ratings
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

-- transactions (no FK by design)
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
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_b ON public.transactions (user_id_b);

-- sessions
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
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_b ON public.sessions (user_id_b);
CREATE INDEX IF NOT EXISTS idx_sessions_model_id ON public.sessions (model_id);

-- dmca_notices
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

-- kyc_applications
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

-- audit_events
CREATE TABLE IF NOT EXISTS public.audit_events (
  id varchar PRIMARY KEY,
  "when" timestamp DEFAULT now(),
  actor varchar(64),
  role varchar(16),
  action varchar(64) NOT NULL,
  target text,
  meta text
);

COMMIT;
