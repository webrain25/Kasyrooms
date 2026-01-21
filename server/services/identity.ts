import { storage } from "../storage.js";
import { db } from "../db.js";
import { logger } from "../logger.js";
import { toDbErrorMeta } from "../dbError.js";
import { getOrCreateAccountBySirplayUserId, upsertWalletSnapshot } from "./sirplayAdapter.js";

type Role = 'user'|'model'|'admin';

/**
 * Ensure a local user exists and is mapped to a Sirplay external user id.
 * - Idempotent: if user already exists, updates minimal fields and touches lastLogin.
 * - Persists best-effort to DB: users + wallets.
 * - Centralizes identity logic to avoid duplicate inserts across endpoints.
 */
export async function ensureLocalUserForSirplay(params: {
  externalUserId: string;
  email?: string | null;
  username?: string | null;
  role?: Role;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null; // ISO string
  phoneNumber?: string | null;
  strictDb?: boolean;
}) {
  const externalUserId = String(params.externalUserId);
  const role: Role = params.role ?? 'user';
  const email = params.email ?? undefined;
  const strictDb = params.strictDb === true;

  // Try resolve existing local user mapped to this external id
  let u = await storage.getUserByExternal(externalUserId);
  if (!u) {
    const uname = (params.username && params.username.trim().length > 0)
      ? params.username!.trim()
      : `sirplay_${externalUserId}`;
    u = await storage.createUser({ username: uname, email, externalUserId, role });
    // Mirror sirplayUserId in in-memory storage for lookups
    try {
      await storage.updateUserById(u.id, { sirplayUserId: externalUserId });
    } catch (e: any) {
      logger.warn("identity.storage_mirror_failed", {
        op: "ensureLocalUserForSirplay.storage_mirror_insert",
        userId: u.id,
        sirplayUserId: externalUserId,
        message: e?.message || String(e),
      });
    }
    // Persist best-effort to DB
    try {
      if (db) {
        // Canonical persistence for Sirplay identities is `accounts` (+ wallet snapshots),
        // not the legacy local `users`/`wallets` tables.
        if (!email) throw new Error("EMAIL_REQUIRED");
        const acc = await getOrCreateAccountBySirplayUserId({
          externalUserId,
          email,
          displayName: params.username ?? u.username,
          role,
        });
        await upsertWalletSnapshot({ accountId: acc.id as number, balanceCents: 0, currency: "EUR" });
      }
    } catch (e: any) {
      logger.error("db_sync_failed", {
        op: "ensureLocalUserForSirplay.upsert_accounts_and_wallet_snapshot",
        userId: u.id,
        sirplayUserId: externalUserId,
        ...toDbErrorMeta(e),
      });
      if (strictDb && db) {
        throw new Error("DB_SYNC_FAILED");
      }
    }
  } else {
    // Touch lastLogin and update minimal profile when possible
    try {
      if (db) {
        if (!email) throw new Error("EMAIL_REQUIRED");
        const acc = await getOrCreateAccountBySirplayUserId({
          externalUserId,
          email,
          displayName: params.username ?? u.username,
          role,
        });
        await upsertWalletSnapshot({ accountId: acc.id as number, balanceCents: 0, currency: "EUR" });
      }
    } catch (e: any) {
      logger.error("db_sync_failed", {
        op: "ensureLocalUserForSirplay.upsert_accounts_and_wallet_snapshot",
        userId: u.id,
        sirplayUserId: externalUserId,
        ...toDbErrorMeta(e),
      });
      if (strictDb && db) {
        throw new Error("DB_SYNC_FAILED");
      }
    }
    // Ensure in-memory mirror also updated
    try {
      await storage.updateUserById(u.id, { sirplayUserId: externalUserId });
    } catch (e: any) {
      logger.warn("identity.storage_mirror_failed", {
        op: "ensureLocalUserForSirplay.storage_mirror_update",
        userId: u.id,
        sirplayUserId: externalUserId,
        message: e?.message || String(e),
      });
    }
  }

  return u;
}
