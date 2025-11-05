import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.warn("[db] DATABASE_URL is not set. DB features will be disabled.");
}

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : undefined as any;
export const db = process.env.DATABASE_URL ? drizzle(sql) : undefined as any;

export * as schema from "@shared/schema";
