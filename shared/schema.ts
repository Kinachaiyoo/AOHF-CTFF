import { pgTable, text, serial, integer, boolean, timestamp, jsonb, inet, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
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
  solveStreak: integer("solve_streak").notNull().default(0),
  lastSolveAt: timestamp("last_solve_at"),
  ipAddress: inet("ip_address"),
  browserFingerprint: text("browser_fingerprint"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
  authorId: integer("author_id"),
  attachmentUrl: text("attachment_url"),
  instanceUrl: text("instance_url"),
  hints: jsonb("hints").$type<{ content: string; cost: number }[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  totalSolves: integer("total_solves").notNull().default(0),
  averageSolveTime: integer("average_solve_time").default(0), // in seconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  website: text("website"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").notNull().default("#00ff41"),
  icon: text("icon").notNull().default("🔒"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const solves = pgTable("solves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  solvedAt: timestamp("solved_at").notNull().defaultNow(),
  solveTime: integer("solve_time"), // time taken to solve in seconds
  isFirstBlood: boolean("is_first_blood").notNull().default(false),
  hintsUsed: integer("hints_used").notNull().default(0),
  pointsAwarded: integer("points_awarded").notNull(),
});

export const flagSubmissions = pgTable("flag_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  submittedFlag: text("submitted_flag").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
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

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "first_blood", "speed_demon", "category_master", etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export const hintUsage = pgTable("hint_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  hintIndex: integer("hint_index").notNull(),
  usedAt: timestamp("used_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  solves: many(solves),
  flagSubmissions: many(flagSubmissions),
  achievements: many(achievements),
  hintUsage: many(hintUsage),
  rateLimits: many(rateLimits),
  sessions: many(sessions),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  author: one(authors, { fields: [challenges.authorId], references: [authors.id] }),
  solves: many(solves),
  flagSubmissions: many(flagSubmissions),
  hintUsage: many(hintUsage),
  rateLimits: many(rateLimits),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  challenges: many(challenges),
}));

export const solvesRelations = relations(solves, ({ one }) => ({
  user: one(users, { fields: [solves.userId], references: [users.id] }),
  challenge: one(challenges, { fields: [solves.challengeId], references: [challenges.id] }),
}));

export const flagSubmissionsRelations = relations(flagSubmissions, ({ one }) => ({
  user: one(users, { fields: [flagSubmissions.userId], references: [users.id] }),
  challenge: one(challenges, { fields: [flagSubmissions.challengeId], references: [challenges.id] }),
}));

export const rateLimitsRelations = relations(rateLimits, ({ one }) => ({
  user: one(users, { fields: [rateLimits.userId], references: [users.id] }),
  challenge: one(challenges, { fields: [rateLimits.challengeId], references: [challenges.id] }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, { fields: [achievements.userId], references: [users.id] }),
}));

export const hintUsageRelations = relations(hintUsage, ({ one }) => ({
  user: one(users, { fields: [hintUsage.userId], references: [users.id] }),
  challenge: one(challenges, { fields: [hintUsage.challengeId], references: [challenges.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

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
  authorId: true,
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
