import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const models = pgTable("models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertModelSchema = createInsertSchema(models).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof models.$inferSelect;
