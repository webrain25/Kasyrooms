import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, date, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  // Use app-generated ids for portability across Postgres installs
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: varchar("role", { length: 16 }).default("user"),
  externalUserId: text("external_user_id"),
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
