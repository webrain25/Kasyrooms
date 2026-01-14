import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  console.warn("[db] DATABASE_URL is not set. DB features will be disabled.");
}

// Neon HTTP driver expects a connection string
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : (undefined as any);

// Drizzle instance (undefined if DATABASE_URL not provided)
export const db = process.env.DATABASE_URL ? drizzle(sql, { schema }) : (undefined as any);

// Re-export schema for convenience
export { schema };
