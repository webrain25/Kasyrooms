import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  date,
  primaryKey,
  bigint,
  bigserial,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  // Use app-generated ids for portability across Postgres installs
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: varchar("role", { length: 16 }).default("user"),
  // External identity mapping (provider + user id)
  externalProvider: text("external_provider"),
  externalUserId: text("external_user_id"),
  // Sirplay-specific identifiers (b2b mapping)
  sirplayUserId: text("sirplay_user_id"),
  sirplayCustomerId: text("sirplay_customer_id"),
  // Extended profile fields per new schema
  firstName: text("first_name"),
  lastName: text("last_name"),
  dob: date("dob"), // YYYY-MM-DD
  country: text("country"),
  phoneNumber: text("phone_number"),
  status: varchar("status", { length: 16 }).default('active'), // active/banned/...
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const models = pgTable("models", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  country: text("country").notNull(),
  languages: text("languages").array().notNull(),
  specialties: text("specialties").array().notNull(),
  isOnline: boolean("is_online").default(false),
  // New: busy state when in a private show
  isBusy: boolean("is_busy").default(false),
  isNew: boolean("is_new").default(false),
  rating: integer("rating").default(0), // out of 50 (5.0 stars * 10)
  viewerCount: integer("viewer_count").default(0),
  profileImage: text("profile_image").notNull(),
  // Simple stats for admin
  privateShows: integer("private_shows").default(0),
  hoursOnline: integer("hours_online").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Additional user profile data captured at registration
export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  firstName: text("first_name"),
  lastName: text("last_name"),
  birthDate: date("birth_date"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Local wallet per user (in cents to avoid floating point)
export const wallets = pgTable("wallets", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  balanceCents: integer("balance_cents").default(0).notNull(),
  currency: varchar("currency", { length: 8 }).default("EUR").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Non-sensitive card metadata associated to a user
export const cards = pgTable("cards", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  brand: text("brand"),
  last4: varchar("last4", { length: 4 }),
  expMonth: integer("exp_month"),
  expYear: integer("exp_year"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Per-user star ratings for models (1..5 stars). Primary key is (modelId, userId)
export const modelRatings = pgTable(
  "model_ratings",
  {
    modelId: varchar("model_id").notNull().references(() => models.id),
    userId: varchar("user_id").notNull().references(() => users.id),
    stars: integer("stars").notNull(),
    createdAt: timestamp("created_at").default(sql`now()`),
    updatedAt: timestamp("updated_at").default(sql`now()`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.modelId, t.userId] }),
  })
);

// Transactions ledger (amount in cents)
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey(),
  userId_B: varchar("user_id_b"), // local user id (B) if applicable
  userId_A: varchar("user_id_a"), // external/shared wallet id (A) if applicable
  type: varchar("type", { length: 24 }).notNull(), // DEPOSIT | WITHDRAWAL | HOLD | RELEASE | CHARGE
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 8 }).default("EUR").notNull(),
  source: text("source"),
  externalRef: text("external_ref"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Live/private sessions for operator insights and billing
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),
  userId_B: varchar("user_id_b").notNull().references(() => users.id),
  modelId: varchar("model_id").notNull().references(() => models.id),
  startedAt: timestamp("started_at").default(sql`now()`),
  endedAt: timestamp("ended_at"),
  durationSec: integer("duration_sec").default(0),
  totalChargedCents: integer("total_charged_cents").default(0),
});

// DMCA notices (simplified)
export const dmcaNotices = pgTable("dmca_notices", {
  id: varchar("id").primaryKey(),
  reporterName: text("reporter_name").notNull(),
  reporterEmail: text("reporter_email").notNull(),
  originalContentUrl: text("original_content_url").notNull(),
  infringingUrls: text("infringing_urls").array().notNull(),
  signature: text("signature").notNull(),
  status: varchar("status", { length: 16 }).default('open').notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// KYC applications (simplified)
export const kycApplications = pgTable("kyc_applications", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth"),
  country: text("country"),
  documentType: varchar("document_type", { length: 32 }),
  documentFrontUrl: text("document_front_url"),
  documentBackUrl: text("document_back_url"),
  selfieUrl: text("selfie_url"),
  status: varchar("status", { length: 16 }).default('pending').notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Audit events
export const auditEvents = pgTable("audit_events", {
  id: varchar("id").primaryKey(),
  when: timestamp("when").default(sql`now()`),
  actor: varchar("actor", { length: 64 }),
  role: varchar("role", { length: 16 }),
  action: varchar("action", { length: 64 }).notNull(),
  target: text("target"),
  meta: text("meta"), // JSON serialized string
});

//
// Accounts + Wallets (Sirplay integration)
//

export const accounts = pgTable("accounts", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  role: text("role").notNull().default("user"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  externalProvider: text("external_provider"),
  externalUserId: text("external_user_id"),
});

export const walletSnapshots = pgTable("wallet_snapshots", {
  accountId: bigint("account_id", { mode: "number" }).primaryKey(),
  provider: text("provider").notNull().default("sirplay"),
  balanceCents: bigint("balance_cents", { mode: "number" }).notNull().default(0),
  currency: text("currency").notNull().default("EUR"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    provider: text("provider").notNull().default("sirplay"),
    externalTransactionId: text("external_transaction_id"),
    type: text("type").notNull(),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("EUR"),
    status: text("status").notNull().default("confirmed"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => ({
    uniqProviderExtId: uniqueIndex("uniq_wallet_tx_provider_extid").on(
      t.provider,
      t.externalTransactionId,
    ),
  })
);

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertModelSchema = createInsertSchema(models).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof models.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type ModelRating = typeof modelRatings.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type DmcaNoticeRow = typeof dmcaNotices.$inferSelect;
export type KycApplicationRow = typeof kycApplications.$inferSelect;
export type AuditEventRow = typeof auditEvents.$inferSelect;
export type AccountRow = typeof accounts.$inferSelect;
export type WalletSnapshotRow = typeof walletSnapshots.$inferSelect;
export type WalletTransactionRow = typeof walletTransactions.$inferSelect;
