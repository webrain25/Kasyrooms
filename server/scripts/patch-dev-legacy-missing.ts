import { neon } from "@neondatabase/serverless";

const TARGET = [
  "public.user_profiles",
  "public.wallets",
  "public.transactions",
  "public.sessions",
  "public.cards",
  "public.model_ratings",
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
  for (const name of TARGET) {
    const rows = await sql`select to_regclass(${name}) as regclass`;
    const regclass = (rows as any)?.[0]?.regclass as string | null | undefined;
    if (!regclass) missing.push(name);
  }

  if (missing.length === 0) {
    console.log("DEV legacy schema OK (all target tables present)");
    return;
  }

  console.log("Missing legacy tables detected:");
  for (const t of missing) console.log(`- ${t}`);
  console.log("Applying patch DDL (create-if-not-exists only)...");

  await sql`begin`;
  try {
    // user_profiles
    await sql`
      create table if not exists public.user_profiles (
        user_id varchar primary key,
        first_name text,
        last_name text,
        birth_date date,
        created_at timestamp default now(),
        constraint user_profiles_user_fk foreign key (user_id) references public.users(id)
      )
    `;

    // wallets
    await sql`
      create table if not exists public.wallets (
        user_id varchar primary key,
        balance_cents integer not null default 0,
        currency varchar(8) not null default 'EUR',
        created_at timestamp default now(),
        constraint wallets_user_fk foreign key (user_id) references public.users(id)
      )
    `;

    // cards
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
    await sql`create index if not exists idx_cards_user_id on public.cards (user_id)`;

    // model_ratings
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

    // transactions (no FK by design)
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
    await sql`create index if not exists idx_transactions_user_id_b on public.transactions (user_id_b)`;

    // sessions
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
    await sql`create index if not exists idx_sessions_user_id_b on public.sessions (user_id_b)`;
    await sql`create index if not exists idx_sessions_model_id on public.sessions (model_id)`;

    // dmca_notices
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

    // kyc_applications
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

    // audit_events
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

    await sql`commit`;
    console.log("DEV legacy schema patch applied successfully");
  } catch (e) {
    await sql`rollback`;
    throw e;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
