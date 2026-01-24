import { neon } from "@neondatabase/serverless";

const REQUIRED = [
  "public.users",
  "public.models",
  "public.user_profiles",
  "public.wallets",
  "public.cards",
  "public.model_ratings",
  "public.transactions",
  "public.sessions",
  "public.dmca_notices",
  "public.kyc_applications",
  "public.audit_events",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(2);
  }

  const sql = neon(url);

  // Detect missing tables
  const missing: string[] = [];
  for (const name of REQUIRED) {
    const rows = await sql`select to_regclass(${name}) as regclass`;
    const regclass = (rows as any)?.[0]?.regclass as string | null | undefined;
    if (!regclass) missing.push(name);
  }

  if (missing.length === 0) {
    console.log("Local schema OK (users + user_profiles + wallets present)");
    return;
  }

  console.log("Missing tables detected:");
  for (const t of missing) console.log(`- ${t}`);
  console.log("Applying targeted DDL (legacy/local schema)...");

  // Create legacy/local tables defined in shared/schema.ts.
  // Notes:
  // - Idempotent and non-destructive: create missing tables and add missing columns/indexes.
  // - Do NOT create Sirplay tables (accounts/wallet_snapshots/wallet_transactions).

  await sql`begin`;
  try {
    await sql`
      create table if not exists public.users (
        id varchar primary key,
        username text not null unique,
        password text not null,
        email text,
        role varchar(16) default 'user',
        external_provider text,
        external_user_id text,
        sirplay_user_id text,
        sirplay_customer_id text,
        first_name text,
        last_name text,
        dob date,
        country text,
        phone_number text,
        status varchar(16) default 'active',
        last_login timestamp,
        created_at timestamp default now()
      )
    `;

    // Patch columns (older DBs may have a subset)
    await sql`alter table if exists public.users add column if not exists external_provider text`;
    await sql`alter table if exists public.users add column if not exists external_user_id text`;
    await sql`alter table if exists public.users add column if not exists sirplay_user_id text`;
    await sql`alter table if exists public.users add column if not exists sirplay_customer_id text`;
    await sql`alter table if exists public.users add column if not exists first_name text`;
    await sql`alter table if exists public.users add column if not exists last_name text`;
    await sql`alter table if exists public.users add column if not exists dob date`;
    await sql`alter table if exists public.users add column if not exists country text`;
    await sql`alter table if exists public.users add column if not exists phone_number text`;
    await sql`alter table if exists public.users add column if not exists status varchar(16) default 'active'`;
    await sql`alter table if exists public.users add column if not exists last_login timestamp`;
    await sql`alter table if exists public.users add column if not exists created_at timestamp default now()`;

    // Admin RBAC fields
    await sql`alter table if exists public.users add column if not exists permissions jsonb`;
    await sql`alter table if exists public.users add column if not exists notes text`;
    await sql`alter table if exists public.users add column if not exists mfa_enabled boolean default false`;
    await sql`alter table if exists public.users add column if not exists mfa_secret text`;
    await sql`alter table if exists public.users add column if not exists created_by_admin_id varchar`;
    await sql`alter table if exists public.users add column if not exists updated_by_admin_id varchar`;
    await sql`alter table if exists public.users add column if not exists updated_at timestamp default now()`;

    await sql`
      create table if not exists public.models (
        id bigint primary key generated always as identity,
        name text not null,
        age integer not null,
        country text not null,
        languages text[] not null,
        specialties text[] not null,
        is_online boolean default false,
        is_busy boolean default false,
        is_new boolean default false,
        rating integer default 0,
        viewer_count integer default 0,
        profile_image text not null,
        private_shows integer default 0,
        hours_online integer default 0,
        created_at timestamp default now()
      )
    `;

    await sql`alter table if exists public.models add column if not exists is_busy boolean default false`;
    await sql`alter table if exists public.models add column if not exists is_new boolean default false`;
    await sql`alter table if exists public.models add column if not exists private_shows integer default 0`;
    await sql`alter table if exists public.models add column if not exists hours_online integer default 0`;

    // Admin moderation fields
    await sql`alter table if exists public.models add column if not exists status varchar(16) default 'active'`;
    await sql`alter table if exists public.models add column if not exists suspended_reason text`;
    await sql`alter table if exists public.models add column if not exists updated_at timestamp default now()`;

    await sql`
      create table if not exists public.user_profiles (
        user_id varchar primary key references public.users(id),
        first_name text,
        last_name text,
        birth_date date,
        created_at timestamp default now()
      )
    `;

    await sql`alter table if exists public.user_profiles add column if not exists first_name text`;
    await sql`alter table if exists public.user_profiles add column if not exists last_name text`;
    await sql`alter table if exists public.user_profiles add column if not exists birth_date date`;
    await sql`alter table if exists public.user_profiles add column if not exists created_at timestamp default now()`;

    await sql`
      create table if not exists public.wallets (
        user_id varchar primary key references public.users(id),
        balance_cents integer not null default 0,
        currency varchar(8) not null default 'EUR',
        created_at timestamp default now()
      )
    `;

    await sql`alter table if exists public.wallets add column if not exists balance_cents integer not null default 0`;
    await sql`alter table if exists public.wallets add column if not exists currency varchar(8) not null default 'EUR'`;
    await sql`alter table if exists public.wallets add column if not exists created_at timestamp default now()`;

    await sql`
      create table if not exists public.cards (
        id varchar primary key,
        user_id varchar not null references public.users(id),
        brand text,
        last4 varchar(4),
        exp_month integer,
        exp_year integer,
        created_at timestamp default now()
      )
    `;

    await sql`
      create table if not exists public.model_ratings (
        model_id bigint not null references public.models(id),
        user_id varchar not null references public.users(id),
        stars integer not null,
        created_at timestamp default now(),
        updated_at timestamp default now(),
        primary key (model_id, user_id)
      )
    `;

    await sql`
      create table if not exists public.transactions (
        id varchar primary key,
        user_id_b varchar,
        user_id_a varchar,
        type varchar(24) not null,
        amount_cents integer not null,
        currency varchar(8) not null default 'EUR',
        source text,
        external_ref text,
        created_at timestamp default now()
      )
    `;

    await sql`
      create table if not exists public.sessions (
        id varchar primary key,
        user_id_b varchar not null references public.users(id),
        model_id bigint not null references public.models(id),
        started_at timestamp default now(),
        ended_at timestamp,
        duration_sec integer default 0,
        total_charged_cents integer default 0
      )
    `;

    await sql`
      create table if not exists public.dmca_notices (
        id varchar primary key,
        reporter_name text not null,
        reporter_email text not null,
        original_content_url text not null,
        infringing_urls text[] not null,
        signature text not null,
        status varchar(16) not null default 'open',
        notes text,
        created_at timestamp default now()
      )
    `;

    await sql`
      create table if not exists public.kyc_applications (
        id varchar primary key,
        user_id varchar references public.users(id),
        full_name text not null,
        date_of_birth date,
        country text,
        document_type varchar(32),
        document_front_url text,
        document_back_url text,
        selfie_url text,
        status varchar(16) not null default 'pending',
        notes text,
        created_at timestamp default now()
      )
    `;

    await sql`
      create table if not exists public.audit_events (
        id varchar primary key,
        "when" timestamp default now(),
        actor varchar(64),
        role varchar(16),
        action varchar(64) not null,
        target text,
        meta text
      )
    `;

    // Moderation: reports / moderation actions / audit log
    await sql`
      create table if not exists public.reports (
        id varchar primary key,
        type varchar(32) not null,
        status varchar(16) not null default 'open',
        severity varchar(16) not null default 'low',

        reported_by_user_id varchar,
        target_user_id varchar,
        target_model_id bigint,
        target_message_id varchar,

        reason_code varchar(64),
        free_text text,

        assigned_to_admin_id varchar,
        resolution_action varchar(64),
        resolution_notes text,

        created_at timestamp default now(),
        updated_at timestamp default now()
      )
    `;

    await sql`
      create table if not exists public.moderation_actions (
        id varchar primary key,
        admin_id varchar not null,
        action varchar(64) not null,
        target_type varchar(32) not null,
        target_id varchar not null,
        reason text,
        metadata jsonb,
        created_at timestamp default now()
      )
    `;

    await sql`
      create table if not exists public.audit_log (
        id varchar primary key,
        actor_admin_id varchar not null,
        action varchar(64) not null,
        target_type varchar(32) not null,
        target_id varchar,
        before jsonb,
        after jsonb,
        ip text,
        user_agent text,
        created_at timestamp default now()
      )
    `;

    // Helpful indexes for common lookups
    await sql`create index if not exists idx_users_external_user_id on public.users (external_user_id)`;
    await sql`create index if not exists idx_users_sirplay_user_id on public.users (sirplay_user_id)`;
    await sql`create index if not exists idx_users_role on public.users (role)`;
    await sql`create index if not exists idx_users_status on public.users (status)`;

    // Case-insensitive unique email (where present)
    await sql`create unique index if not exists uniq_users_email_ci on public.users (lower(email)) where email is not null`;
    await sql`create index if not exists idx_cards_user_id on public.cards (user_id)`;
    await sql`create index if not exists idx_transactions_user_id_b on public.transactions (user_id_b)`;
    await sql`create index if not exists idx_sessions_user_id_b on public.sessions (user_id_b)`;
    await sql`create index if not exists idx_sessions_model_id on public.sessions (model_id)`;

    await sql`create index if not exists idx_models_status on public.models (status)`;

    await sql`create index if not exists idx_reports_status_created_at on public.reports (status, created_at desc)`;
    await sql`create index if not exists idx_reports_assigned_to on public.reports (assigned_to_admin_id)`;
    await sql`create index if not exists idx_moderation_actions_admin_id on public.moderation_actions (admin_id, created_at desc)`;
    await sql`create index if not exists idx_moderation_actions_target on public.moderation_actions (target_type, target_id)`;
    await sql`create index if not exists idx_audit_actor_created_at on public.audit_log (actor_admin_id, created_at desc)`;
    await sql`create index if not exists idx_audit_action_created_at on public.audit_log (action, created_at desc)`;

    await sql`commit`;
    console.log("DDL applied successfully");
  } catch (e) {
    await sql`rollback`;
    throw e;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
