// server/scripts/reconcile-sirplay-mapping.ts
// Scan users without Sirplay mapping and reconcile using accounts table.
import dotenv from 'dotenv';
import { db } from '../db';
import { users, accounts } from '@shared/schema';
import { sql, and, eq } from 'drizzle-orm';

async function main() {
  dotenv.config();
  if (!db) {
    console.error('DB_DISABLED');
    process.exit(1);
  }

  // Find users with missing/empty externalUserId
  const unmapped = await db.select().from(users).where(sql`external_user_id is null or external_user_id = ''`);
  console.log(`[reconcile] Unmapped users: ${unmapped.length}`);

  let mapped = 0;
  let archived = 0;

  for (const u of unmapped as any[]) {
    const email = (u.email || '').trim().toLowerCase();
    if (!email) {
      // No email to match; archive
      try {
        await db.update(users).set({ status: 'archived' }).where(eq(users.id, u.id));
        archived++;
        console.log(`[archived] ${u.id} (no email)`);
      } catch (e: any) {
        console.warn(`[archive_failed] ${u.id}: ${e?.message || e}`);
      }
      continue;
    }

    const acc = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.email, email), eq(accounts.externalProvider, 'sirplay')))
      .limit(1);

    const a = acc[0] as any;
    const extId = a?.externalUserId || a?.external_user_id || null;
    if (extId && String(extId).trim().length > 0) {
      try {
        await db
          .update(users)
          .set({ externalProvider: 'sirplay', externalUserId: String(extId) })
          .where(eq(users.id, u.id));
        mapped++;
        console.log(`[mapped] ${u.id} <- ${extId}`);
      } catch (e: any) {
        console.warn(`[map_failed] ${u.id}: ${e?.message || e}`);
      }
    } else {
      try {
        await db.update(users).set({ status: 'archived' }).where(eq(users.id, u.id));
        archived++;
        console.log(`[archived] ${u.id} (no sirplay mapping)`);
      } catch (e: any) {
        console.warn(`[archive_failed] ${u.id}: ${e?.message || e}`);
      }
    }
  }

  console.log(`[reconcile] mapped=${mapped}, archived=${archived}`);
}

main().catch((e) => {
  console.error('Fatal:', e?.message || e);
  process.exit(1);
});
