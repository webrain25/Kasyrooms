import { neon } from "@neondatabase/serverless";

const REQUIRED = [
  "public.accounts",
  "public.wallet_snapshots",
  "public.wallet_transactions",
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
    console.log("Sirplay schema OK (accounts + wallet_* present)");
    return;
  }

  console.log("Missing tables detected:");
  for (const t of missing) console.log(`- ${t}`);
  console.log("Applying targeted DDL...");

  // Create only what production Sirplay paths use.
  // Notes:
  // - Keep this minimal and idempotent.
  // - Avoid creating legacy local-auth tables (users/wallets).

  await sql`begin`;
  try {
    await sql`
      create table if not exists public.accounts (
        id bigint primary key generated always as identity,
        role text not null default 'user',
        email text not null unique,
        password_hash text not null,
        display_name text,
        avatar_url text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        external_provider text,
        external_user_id text
      )
    `;

    await sql`
      create table if not exists public.wallet_snapshots (
        account_id bigint primary key,
        provider text not null default 'sirplay',
        balance_cents bigint not null default 0,
        currency text not null default 'EUR',
        updated_at timestamptz not null default now()
      )
    `;

    await sql`
      create table if not exists public.wallet_transactions (
        id bigserial primary key,
        account_id bigint not null,
        provider text not null default 'sirplay',
        external_transaction_id text,
        type text not null,
        amount_cents bigint not null,
        currency text not null default 'EUR',
        status text not null default 'confirmed',
        metadata jsonb,
        created_at timestamptz not null default now()
      )
    `;

    // Unique index used by idempotent insert
    await sql`
      create unique index if not exists uniq_wallet_tx_provider_extid
      on public.wallet_transactions (provider, external_transaction_id)
    `;

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
