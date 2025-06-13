import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  country: text("country"),
  bio: text("bio"),
  avatar: text("avatar"),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  points: integer("points").notNull(),
  flag: text("flag").notNull(),
  flagFormat: text("flag_format").notNull().default("CyberCTF{...}"),
  author: text("author").notNull(),
  attachmentUrl: text("attachment_url"),
  instanceUrl: text("instance_url"),
  hints: jsonb("hints").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const solves = pgTable("solves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  solvedAt: timestamp("solved_at").notNull().defaultNow(),
  isFirstBlood: boolean("is_first_blood").notNull().default(false),
});

export const flagSubmissions = pgTable("flag_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  submittedFlag: text("submitted_flag").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  attempts: integer("attempts").notNull().default(0),
  lastAttempt: timestamp("last_attempt").notNull().defaultNow(),
  nextAllowedAt: timestamp("next_allowed_at"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
});

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  contact: text("contact"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  country: true,
  bio: true,
  avatar: true,
}).extend({
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    "Password must contain at least 8 characters with uppercase, lowercase, number and special character"),
});

export const insertChallengeSchema = createInsertSchema(challenges).pick({
  title: true,
  description: true,
  category: true,
  difficulty: true,
  points: true,
  flag: true,
  flagFormat: true,
  author: true,
  attachmentUrl: true,
  instanceUrl: true,
  hints: true,
  isActive: true,
});

export const insertSolveSchema = createInsertSchema(solves).pick({
  userId: true,
  challengeId: true,
});

export const insertFlagSubmissionSchema = createInsertSchema(flagSubmissions).pick({
  userId: true,
  challengeId: true,
  submittedFlag: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const adminLoginSchema = z.object({
  username: z.literal("admin"),
  password: z.literal("admin"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Solve = typeof solves.$inferSelect;
export type InsertSolve = z.infer<typeof insertSolveSchema>;
export type FlagSubmission = typeof flagSubmissions.$inferSelect;
export type InsertFlagSubmission = z.infer<typeof insertFlagSubmissionSchema>;
export type RateLimit = typeof rateLimits.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Author = typeof authors.$inferSelect;
