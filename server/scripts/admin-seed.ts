import crypto from "crypto";
import { db, schema } from "../db.js";
import { and, eq, sql } from "drizzle-orm";
import { hashPasswordPBKDF2 } from "../auth/password.js";

function requiredEnv(name: string): string {
  const v = String(process.env[name] || "").trim();
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

(async () => {
  if (!db) {
    console.error("[admin:seed] DATABASE_URL not set; DB disabled");
    process.exit(2);
  }

  const email = requiredEnv("ADMIN_SEED_EMAIL").toLowerCase();
  const username = requiredEnv("ADMIN_SEED_USERNAME");
  const password = requiredEnv("ADMIN_SEED_PASSWORD");

  const existingByUsername = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  const existingByEmail = await db
    .select()
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email}`)
    .limit(1);

  const existing = existingByUsername[0] || existingByEmail[0];
  if (existing) {
    console.log("[admin:seed] Admin already exists", {
      id: (existing as any).id,
      username: (existing as any).username,
      email: (existing as any).email,
      role: (existing as any).role,
    });
    process.exit(0);
  }

  const id = crypto.randomUUID();
  const passwordHash = hashPasswordPBKDF2(password);

  await db.insert(schema.users).values({
    id,
    username,
    email,
    password: passwordHash,
    role: "admin",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  console.log("[admin:seed] Admin created", { id, username, email });
})().catch((e) => {
  console.error("[admin:seed] Failed:", e?.message || e);
  process.exit(1);
});
