import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { accounts } from "@shared/schema";

type CreateOrGetAccountInput = {
  externalUserId: string;
  email: string; // mandatory
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: "user" | "model" | "admin";
};

export async function getOrCreateAccountBySirplayUserId(input: CreateOrGetAccountInput) {
  if (!db) throw new Error("DB_DISABLED");
  const provider = "sirplay";
  const externalId = String(input.externalUserId);
  const email = String(input.email || "").trim().toLowerCase();
  if (!email || email.length === 0) throw new Error("EMAIL_REQUIRED");

  // Lookup 1: by mapping (provider + external_user_id)
  const byMapping = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.externalProvider, provider), eq(accounts.externalUserId, externalId)))
    .limit(1);
  if (byMapping[0]) return byMapping[0];

  // Lookup 2: by email
  const byEmail = await db.select().from(accounts).where(eq(accounts.email, email)).limit(1);
  const role = input.role ?? "user";
  const passwordHash = "SIRPLAY_AUTH_ONLY";

  if (byEmail[0]) {
    const row = byEmail[0] as any;
    const curExt = row.external_user_id ?? row.externalUserId ?? null;
    const curProv = row.external_provider ?? row.externalProvider ?? null;
    if (curExt == null || curProv == null) {
      // Update mapping for existing account
      await db.execute(sql`
        update public.accounts
        set external_provider = ${provider}, external_user_id = ${externalId}
        where email = ${email}
      `);
      const updated = await db.select().from(accounts).where(eq(accounts.email, email)).limit(1);
      return updated[0];
    }
    if (String(curExt) !== externalId) {
      throw new Error("EMAIL_ALREADY_LINKED_TO_DIFFERENT_SIRPLAY_ID");
    }
    // Already linked; return existing
    return row;
  }

  // Else: create new account and link mapping
  await db.execute(sql`
    insert into public.accounts
      (role, email, password_hash, display_name, avatar_url, external_provider, external_user_id)
    values
      (${role}, ${email}, ${passwordHash}, ${input.displayName ?? null}, ${input.avatarUrl ?? null}, ${provider}, ${externalId})
  `);
  const created = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.externalProvider, provider), eq(accounts.externalUserId, externalId)))
    .limit(1);
  if (!created[0]) throw new Error("ACCOUNT_CREATE_FAILED_MAPPING_MISSING");
  return created[0];
}

export async function upsertWalletSnapshot(params: { accountId: number; balanceCents: number; currency?: string }) {
  if (!db) throw new Error("DB_DISABLED");
  const provider = "sirplay";
  const currency = params.currency ?? "EUR";

  await db.execute(sql`
    insert into public.wallet_snapshots (account_id, provider, balance_cents, currency)
    values (${params.accountId}, ${provider}, ${params.balanceCents}, ${currency})
    on conflict (account_id)
    do update set
      balance_cents = excluded.balance_cents,
      currency = excluded.currency,
      updated_at = now()
  `);
}

export async function recordWalletTransactionIdempotent(params: {
  accountId: number;
  externalTransactionId: string;
  type: string;
  amountCents: number;
  currency?: string;
  status?: string;
  metadata?: unknown;
}) {
  if (!db) throw new Error("DB_DISABLED");

  const provider = "sirplay";
  const currency = params.currency ?? "EUR";
  const status = params.status ?? "confirmed";

  if (!params.externalTransactionId) {
    throw new Error("MISSING_EXTERNAL_TRANSACTION_ID");
  }

  try {
    await db.execute(sql`
      insert into public.wallet_transactions
        (account_id, provider, external_transaction_id, type, amount_cents, currency, status, metadata)
      values
        (
          ${params.accountId},
          ${provider},
          ${params.externalTransactionId},
          ${params.type},
          ${params.amountCents},
          ${currency},
          ${status},
          ${JSON.stringify(params.metadata ?? null)}::jsonb
        )
    `);
  } catch (err: any) {
    // 23505 = unique_violation => transaction already recorded => idempotency OK
    if (err?.code === "23505") return;
    throw err;
  }
}
