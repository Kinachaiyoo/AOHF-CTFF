import { 
  users, challenges, solves, flagSubmissions, rateLimits, categories, authors, achievements, hintUsage, sessions,
  type User, type InsertUser, type Challenge, type InsertChallenge, 
  type Solve, type InsertSolve, type FlagSubmission, type InsertFlagSubmission,
  type RateLimit, type Category, type Author
} from "@shared/schema";
import { eq, desc, sql, and, count, avg, or, gte, lte, asc } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        solveStreak: 0,
        lastSolveAt: null,
        ipAddress: null,
        browserFingerprint: null,
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.score));
  }

  async getUserStats(userId: number): Promise<{ solves: number; score: number; rank: number }> {
    const user = await this.getUser(userId);
    if (!user) return { solves: 0, score: 0, rank: 0 };

    const [solvesResult] = await db
      .select({ count: count() })
      .from(solves)
      .where(eq(solves.userId, userId));

    const [rankResult] = await db
      .select({ rank: count() })
      .from(users)
      .where(gte(users.score, user.score));

    return {
      solves: solvesResult.count,
      score: user.score,
      rank: rankResult.rank,
    };
  }

  // Challenges
  async getAllChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges).where(eq(challenges.isActive, true));
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge || undefined;
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const [challenge] = await db
      .insert(challenges)
      .values({
        ...insertChallenge,
        totalSolves: 0,
        averageSolveTime: 0,
        updatedAt: new Date(),
      })
      .returning();
    return challenge;
  }

  async updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge | undefined> {
    const [challenge] = await db
      .update(challenges)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(challenges.id, id))
      .returning();
    return challenge || undefined;
  }

  async deleteChallenge(id: number): Promise<boolean> {
    const result = await db.delete(challenges).where(eq(challenges.id, id));
    return result.rowCount > 0;
  }

  async getChallengesByCategory(category: string): Promise<Challenge[]> {
    return await db
      .select()
      .from(challenges)
      .where(and(eq(challenges.category, category), eq(challenges.isActive, true)));
  }

  // Solves
  async getSolve(userId: number, challengeId: number): Promise<Solve | undefined> {
    const [solve] = await db
      .select()
      .from(solves)
      .where(and(eq(solves.userId, userId), eq(solves.challengeId, challengeId)));
    return solve || undefined;
  }

  async createSolve(insertSolve: InsertSolve): Promise<Solve> {
    // Check if this is first blood
    const isFirstBlood = await this.checkFirstBlood(insertSolve.challengeId);
    
    const challenge = await this.getChallenge(insertSolve.challengeId);
    const pointsAwarded = challenge ? challenge.points : 0;

    const [solve] = await db
      .insert(solves)
      .values({
        ...insertSolve,
        isFirstBlood,
        pointsAwarded,
        solveTime: null,
        hintsUsed: 0,
      })
      .returning();

    // Update user score and solve streak
    await this.updateUserScoreAndStreak(insertSolve.userId, pointsAwarded);
    
    // Update challenge total solves
    await db
      .update(challenges)
      .set({ 
        totalSolves: sql`${challenges.totalSolves} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(challenges.id, insertSolve.challengeId));

    // Award achievements
    await this.checkAndAwardAchievements(insertSolve.userId, insertSolve.challengeId, isFirstBlood);

    return solve;
  }

  async getUserSolves(userId: number): Promise<(Solve & { challenge: Challenge })[]> {
    return await db
      .select()
      .from(solves)
      .innerJoin(challenges, eq(solves.challengeId, challenges.id))
      .where(eq(solves.userId, userId))
      .orderBy(desc(solves.solvedAt));
  }

  async getChallengeSolves(challengeId: number): Promise<(Solve & { user: User })[]> {
    return await db
      .select()
      .from(solves)
      .innerJoin(users, eq(solves.userId, users.id))
      .where(eq(solves.challengeId, challengeId))
      .orderBy(asc(solves.solvedAt));
  }

  async getLatestSolves(limit = 10): Promise<(Solve & { user: User; challenge: Challenge })[]> {
    return await db
      .select()
      .from(solves)
      .innerJoin(users, eq(solves.userId, users.id))
      .innerJoin(challenges, eq(solves.challengeId, challenges.id))
      .orderBy(desc(solves.solvedAt))
      .limit(limit);
  }

  async checkFirstBlood(challengeId: number): Promise<boolean> {
    const [result] = await db
      .select({ count: count() })
      .from(solves)
      .where(eq(solves.challengeId, challengeId));
    return result.count === 0;
  }

  // Flag submissions with forensic tracking
  async createFlagSubmission(submission: InsertFlagSubmission & { 
    ipAddress?: string; 
    userAgent?: string; 
    isCorrect: boolean;
  }): Promise<FlagSubmission> {
    const [flagSubmission] = await db
      .insert(flagSubmissions)
      .values({
        ...submission,
        ipAddress: submission.ipAddress || null,
        userAgent: submission.userAgent || null,
      })
      .returning();
    return flagSubmission;
  }

  async getFlagSubmissions(userId: number, challengeId: number): Promise<FlagSubmission[]> {
    return await db
      .select()
      .from(flagSubmissions)
      .where(and(eq(flagSubmissions.userId, userId), eq(flagSubmissions.challengeId, challengeId)))
      .orderBy(desc(flagSubmissions.submittedAt));
  }

  // Advanced rate limiting with progressive delays
  async getRateLimit(userId: number, challengeId: number): Promise<RateLimit | undefined> {
    const [rateLimit] = await db
      .select()
      .from(rateLimits)
      .where(and(eq(rateLimits.userId, userId), eq(rateLimits.challengeId, challengeId)));
    return rateLimit || undefined;
  }

  async updateRateLimit(userId: number, challengeId: number, attempts: number, nextAllowedAt?: Date): Promise<RateLimit> {
    const existing = await this.getRateLimit(userId, challengeId);
    
    if (existing) {
      const [updated] = await db
        .update(rateLimits)
        .set({
          attempts,
          lastAttempt: new Date(),
          nextAllowedAt: nextAllowedAt || null,
        })
        .where(and(eq(rateLimits.userId, userId), eq(rateLimits.challengeId, challengeId)))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(rateLimits)
        .values({
          userId,
          challengeId,
          attempts,
          lastAttempt: new Date(),
          nextAllowedAt: nextAllowedAt || null,
        })
        .returning();
      return created;
    }
  }

  async canSubmitFlag(userId: number, challengeId: number): Promise<boolean> {
    const rateLimit = await this.getRateLimit(userId, challengeId);
    if (!rateLimit || !rateLimit.nextAllowedAt) return true;
    return new Date() >= rateLimit.nextAllowedAt;
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true));
  }

  async createCategory(categoryData: { name: string; color: string; icon: string }): Promise<Category> {
    const [category] = await db.insert(categories).values({
      name: categoryData.name,
      color: categoryData.color,
      icon: categoryData.icon,
      isActive: true,
      createdAt: new Date(),
    }).returning();
    return category;
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    const [category] = await db.update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.update(categories)
      .set({ isActive: false })
      .where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Authors
  async getAllAuthors(): Promise<Author[]> {
    return await db.select().from(authors).where(eq(authors.isActive, true));
  }

  async createAuthor(authorData: { name: string }): Promise<Author> {
    const [author] = await db.insert(authors).values({
      name: authorData.name,
      isActive: true,
      createdAt: new Date(),
    }).returning();
    return author;
  }

  async updateAuthor(id: number, updates: Partial<Author>): Promise<Author | undefined> {
    const [author] = await db.update(authors)
      .set(updates)
      .where(eq(authors.id, id))
      .returning();
    return author;
  }

  async deleteAuthor(id: number): Promise<boolean> {
    const result = await db.update(authors)
      .set({ isActive: false })
      .where(eq(authors.id, id));
    return result.rowCount > 0;
  }

  // Leaderboard with advanced analytics
  async getLeaderboard(limit = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.score), desc(users.solveStreak))
      .limit(limit);
  }

  async getCountryLeaderboard(): Promise<{ country: string; totalScore: number; userCount: number }[]> {
    return await db
      .select({
        country: users.country,
        totalScore: sql<number>`sum(${users.score})`,
        userCount: count(),
      })
      .from(users)
      .where(sql`${users.country} IS NOT NULL`)
      .groupBy(users.country)
      .orderBy(desc(sql`sum(${users.score})`));
  }

  // Advanced features
  private async updateUserScoreAndStreak(userId: number, points: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const newScore = user.score + points;
    const now = new Date();
    const lastSolveDate = user.lastSolveAt;
    
    let newStreak = user.solveStreak;
    if (lastSolveDate) {
      const daysDiff = Math.floor((now.getTime() - lastSolveDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await db
      .update(users)
      .set({
        score: newScore,
        solveStreak: newStreak,
        lastSolveAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  }

  private async checkAndAwardAchievements(userId: number, challengeId: number, isFirstBlood: boolean): Promise<void> {
    const achievements_to_award = [];

    if (isFirstBlood) {
      achievements_to_award.push({
        userId,
        type: "first_blood",
        title: "First Blood!",
        description: "First to solve this challenge",
        icon: "🩸",
      });
    }

    const userSolves = await this.getUserSolves(userId);
    if (userSolves.length === 1) {
      achievements_to_award.push({
        userId,
        type: "first_solve",
        title: "Getting Started",
        description: "Solved your first challenge",
        icon: "🎯",
      });
    } else if (userSolves.length === 10) {
      achievements_to_award.push({
        userId,
        type: "solver",
        title: "Problem Solver",
        description: "Solved 10 challenges",
        icon: "🧩",
      });
    } else if (userSolves.length === 50) {
      achievements_to_award.push({
        userId,
        type: "expert",
        title: "Expert Hacker",
        description: "Solved 50 challenges",
        icon: "💎",
      });
    }

    if (achievements_to_award.length > 0) {
      await db.insert(achievements).values(achievements_to_award);
    }
  }

  // Hint system
  async useHint(userId: number, challengeId: number, hintIndex: number): Promise<void> {
    await db.insert(hintUsage).values({
      userId,
      challengeId,
      hintIndex,
    });

    // Deduct hint cost from user score
    const challenge = await this.getChallenge(challengeId);
    if (challenge && challenge.hints && challenge.hints[hintIndex]) {
      const hint = challenge.hints[hintIndex] as { content: string; cost: number };
      await db
        .update(users)
        .set({
          score: sql`${users.score} - ${hint.cost}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  }

  async getUserHints(userId: number, challengeId: number): Promise<number[]> {
    const hints = await db
      .select()
      .from(hintUsage)
      .where(and(eq(hintUsage.userId, userId), eq(hintUsage.challengeId, challengeId)));
    return hints.map(h => h.hintIndex);
  }

  // Session management
  async createSession(userId: number, sessionId: string, expiresAt: Date): Promise<void> {
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      expiresAt,
    });
  }

  async getSession(sessionId: string): Promise<{ userId: number } | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), gte(sessions.expiresAt, new Date())));
    return session ? { userId: session.userId } : undefined;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  // Analytics and forensics
  async getSubmissionForensics(challengeId?: number): Promise<{
    wrongFlags: string[];
    timeGaps: number[];
    ipLogs: string[];
    browserFingerprints: string[];
  }> {
    const query = db.select().from(flagSubmissions).where(eq(flagSubmissions.isCorrect, false));
    
    if (challengeId) {
      query.where(and(eq(flagSubmissions.isCorrect, false), eq(flagSubmissions.challengeId, challengeId)));
    }

    const submissions = await query.orderBy(desc(flagSubmissions.submittedAt));

    return {
      wrongFlags: [...new Set(submissions.map(s => s.submittedFlag))],
      timeGaps: submissions.slice(1).map((curr, i) => 
        Math.floor((submissions[i].submittedAt.getTime() - curr.submittedAt.getTime()) / 1000)
      ),
      ipLogs: [...new Set(submissions.map(s => s.ipAddress).filter(Boolean))],
      browserFingerprints: [...new Set(submissions.map(s => s.userAgent).filter(Boolean))],
    };
  }

  async getChallengeAnalytics(challengeId: number): Promise<{
    totalAttempts: number;
    uniqueSolvers: number;
    averageSolveTime: number;
    difficultyRating: number;
  }> {
    const [attemptsResult] = await db
      .select({ count: count() })
      .from(flagSubmissions)
      .where(eq(flagSubmissions.challengeId, challengeId));

    const [solversResult] = await db
      .select({ count: count() })
      .from(solves)
      .where(eq(solves.challengeId, challengeId));

    const [avgTimeResult] = await db
      .select({ avg: avg(solves.solveTime) })
      .from(solves)
      .where(eq(solves.challengeId, challengeId));

    const difficultyRating = attemptsResult.count > 0 ? 
      Math.min(10, Math.floor((attemptsResult.count / Math.max(1, solversResult.count)) * 2)) : 5;

    return {
      totalAttempts: attemptsResult.count,
      uniqueSolvers: solversResult.count,
      averageSolveTime: Math.floor(Number(avgTimeResult.avg) || 0),
      difficultyRating,
    };
  }
}