import { storage } from "../storage.js";
import { db, schema } from "../db.js";
import { eq, sql } from "drizzle-orm";

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
}) {
  const externalUserId = String(params.externalUserId);
  const role: Role = params.role ?? 'user';
  const email = params.email ?? undefined;

  // Try resolve existing local user mapped to this external id
  let u = await storage.getUserByExternal(externalUserId);
  if (!u) {
    const uname = (params.username && params.username.trim().length > 0)
      ? params.username!.trim()
      : `sirplay_${externalUserId}`;
    u = await storage.createUser({ username: uname, email, externalUserId, role });
    // Persist best-effort to DB
    try {
      if (db) {
        await db.insert(schema.users).values({
          id: u.id,
          username: u.username,
          password: '-',
          email: u.email,
          role: role,
          externalProvider: 'sirplay',
          externalUserId,
          firstName: params.firstName ?? undefined,
          lastName: params.lastName ?? undefined,
          dob: params.birthDate ? new Date(params.birthDate) as any : undefined,
          phoneNumber: params.phoneNumber ?? undefined,
          status: 'active',
          lastLogin: new Date() as any,
        });
        // Ensure wallet row exists (idempotent)
        await db.execute(sql`
          insert into public.wallets (user_id, balance_cents, currency)
          values (${u.id}, ${0}, ${'EUR'})
          on conflict (user_id) do nothing
        `);
      }
    } catch {}
  } else {
    // Touch lastLogin and update minimal profile when possible
    try {
      if (db) {
        await db.update(schema.users).set({
          lastLogin: new Date() as any,
          email: email ?? u.email,
          firstName: params.firstName ?? (u as any).firstName,
          lastName: params.lastName ?? (u as any).lastName,
          phoneNumber: params.phoneNumber ?? (u as any).phoneNumber,
          dob: params.birthDate ? new Date(params.birthDate) as any : (u as any).dob,
          externalProvider: 'sirplay',
          externalUserId: externalUserId,
        }).where(eq(schema.users.id, u.id));
        // Ensure wallet row exists (idempotent)
        await db.execute(sql`
          insert into public.wallets (user_id, balance_cents, currency)
          values (${u.id}, ${0}, ${'EUR'})
          on conflict (user_id) do nothing
        `);
      }
    } catch {}
  }

  return u;
}
