-- Admin RBAC + Moderation schema (MVP)
-- Idempotent: safe to run multiple times.

BEGIN;

-- Users: RBAC fields
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS permissions jsonb;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS mfa_secret text;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS created_by_admin_id varchar;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS updated_by_admin_id varchar;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- Email uniqueness (case-insensitive) where present
CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_email_ci ON public.users (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users (status);

-- Models: moderation fields
ALTER TABLE IF EXISTS public.models ADD COLUMN IF NOT EXISTS status varchar(16) DEFAULT 'active';
ALTER TABLE IF EXISTS public.models ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE IF EXISTS public.models ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_models_status ON public.models (status);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id varchar PRIMARY KEY,
  type varchar(32) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'open',
  severity varchar(16) NOT NULL DEFAULT 'low',

  reported_by_user_id varchar,
  target_user_id varchar,
  target_model_id bigint,
  target_message_id varchar,

  reason_code varchar(64),
  free_text text,

  assigned_to_admin_id varchar,
  resolution_action varchar(64),
  resolution_notes text,

  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status_created_at ON public.reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_to ON public.reports (assigned_to_admin_id);

-- Moderation actions
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id varchar PRIMARY KEY,
  admin_id varchar NOT NULL,
  action varchar(64) NOT NULL,
  target_type varchar(32) NOT NULL,
  target_id varchar NOT NULL,
  reason text,
  metadata jsonb,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin_id ON public.moderation_actions (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON public.moderation_actions (target_type, target_id);

-- Audit log (append-only)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id varchar PRIMARY KEY,
  actor_admin_id varchar NOT NULL,
  action varchar(64) NOT NULL,
  target_type varchar(32) NOT NULL,
  target_id varchar,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor_created_at ON public.audit_log (actor_admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action_created_at ON public.audit_log (action, created_at DESC);

COMMIT;
