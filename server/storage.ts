import { 
  users, challenges, solves, flagSubmissions, rateLimits, categories, authors,
  type User, type InsertUser, type Challenge, type InsertChallenge, 
  type Solve, type InsertSolve, type FlagSubmission, type InsertFlagSubmission,
  type RateLimit, type Category, type Author
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserStats(userId: number): Promise<{ solves: number; score: number; rank: number }>;

  // Challenges
  getAllChallenges(): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge | undefined>;
  deleteChallenge(id: number): Promise<boolean>;
  getChallengesByCategory(category: string): Promise<Challenge[]>;

  // Solves
  getSolve(userId: number, challengeId: number): Promise<Solve | undefined>;
  createSolve(solve: InsertSolve): Promise<Solve>;
  getUserSolves(userId: number): Promise<(Solve & { challenge: Challenge })[]>;
  getChallengeSolves(challengeId: number): Promise<(Solve & { user: User })[]>;
  getLatestSolves(limit?: number): Promise<(Solve & { user: User; challenge: Challenge })[]>;
  checkFirstBlood(challengeId: number): Promise<boolean>;

  // Flag submissions
  createFlagSubmission(submission: InsertFlagSubmission): Promise<FlagSubmission>;
  getFlagSubmissions(userId: number, challengeId: number): Promise<FlagSubmission[]>;

  // Rate limiting
  getRateLimit(userId: number, challengeId: number): Promise<RateLimit | undefined>;
  updateRateLimit(userId: number, challengeId: number, attempts: number, nextAllowedAt?: Date): Promise<RateLimit>;
  canSubmitFlag(userId: number, challengeId: number): Promise<boolean>;

  // Categories
  getAllCategories(): Promise<Category[]>;

  // Authors
  getAllAuthors(): Promise<Author[]>;

  // Leaderboard
  getLeaderboard(limit?: number): Promise<User[]>;
  getCountryLeaderboard(): Promise<{ country: string; totalScore: number; userCount: number }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private challenges: Map<number, Challenge>;
  private solves: Map<string, Solve>;
  private flagSubmissions: Map<string, FlagSubmission[]>;
  private rateLimits: Map<string, RateLimit>;
  private categories: Map<number, Category>;
  private authors: Map<number, Author>;
  private currentUserId: number;
  private currentChallengeId: number;
  private currentSolveId: number;
  private currentSubmissionId: number;
  private currentRateLimitId: number;
  private currentCategoryId: number;
  private currentAuthorId: number;

  constructor() {
    this.users = new Map();
    this.challenges = new Map();
    this.solves = new Map();
    this.flagSubmissions = new Map();
    this.rateLimits = new Map();
    this.categories = new Map();
    this.authors = new Map();
    this.currentUserId = 1;
    this.currentChallengeId = 1;
    this.currentSolveId = 1;
    this.currentSubmissionId = 1;
    this.currentRateLimitId = 1;
    this.currentCategoryId = 1;
    this.currentAuthorId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Initialize categories
    const defaultCategories: Omit<Category, 'id'>[] = [
      { name: 'Web', description: 'Web application security', color: '#00ff88', icon: 'fas fa-code' },
      { name: 'Crypto', description: 'Cryptography challenges', color: '#00d4ff', icon: 'fas fa-lock' },
      { name: 'Pwn', description: 'Binary exploitation', color: '#ff0080', icon: 'fas fa-bug' },
      { name: 'Forensics', description: 'Digital forensics', color: '#ffff00', icon: 'fas fa-search' },
      { name: 'Misc', description: 'Miscellaneous challenges', color: '#ff6b35', icon: 'fas fa-puzzle-piece' },
    ];

    defaultCategories.forEach(cat => {
      const category: Category = { ...cat, id: this.currentCategoryId++ };
      this.categories.set(category.id, category);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id, 
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      isAdmin: false, 
      country: insertUser.country ?? null,
      bio: insertUser.bio ?? null,
      avatar: insertUser.avatar ?? null,
      score: 0, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserStats(userId: number): Promise<{ solves: number; score: number; rank: number }> {
    const user = await this.getUser(userId);
    if (!user) return { solves: 0, score: 0, rank: 0 };

    const userSolves = Array.from(this.solves.values()).filter(s => s.userId === userId);
    const allUsers = Array.from(this.users.values()).sort((a, b) => b.score - a.score);
    const rank = allUsers.findIndex(u => u.id === userId) + 1;

    return {
      solves: userSolves.length,
      score: user.score,
      rank,
    };
  }

  async getAllChallenges(): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter(c => c.isActive);
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const id = this.currentChallengeId++;
    const challenge: Challenge = { 
      ...insertChallenge, 
      id, 
      createdAt: new Date() 
    };
    this.challenges.set(id, challenge);
    return challenge;
  }

  async updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge | undefined> {
    const challenge = this.challenges.get(id);
    if (!challenge) return undefined;
    
    const updatedChallenge = { ...challenge, ...updates };
    this.challenges.set(id, updatedChallenge);
    return updatedChallenge;
  }

  async deleteChallenge(id: number): Promise<boolean> {
    return this.challenges.delete(id);
  }

  async getChallengesByCategory(category: string): Promise<Challenge[]> {
    return Array.from(this.challenges.values())
      .filter(c => c.category === category && c.isActive);
  }

  async getSolve(userId: number, challengeId: number): Promise<Solve | undefined> {
    return this.solves.get(`${userId}-${challengeId}`);
  }

  async createSolve(insertSolve: InsertSolve): Promise<Solve> {
    const id = this.currentSolveId++;
    const isFirstBlood = await this.checkFirstBlood(insertSolve.challengeId);
    const solve: Solve = { 
      ...insertSolve, 
      id, 
      isFirstBlood,
      solvedAt: new Date() 
    };
    this.solves.set(`${insertSolve.userId}-${insertSolve.challengeId}`, solve);

    // Update user score
    const challenge = await this.getChallenge(insertSolve.challengeId);
    const user = await this.getUser(insertSolve.userId);
    if (challenge && user) {
      let points = challenge.points;
      if (isFirstBlood) points += 50; // First blood bonus
      await this.updateUser(user.id, { score: user.score + points });
    }

    return solve;
  }

  async getUserSolves(userId: number): Promise<(Solve & { challenge: Challenge })[]> {
    const userSolves = Array.from(this.solves.values()).filter(s => s.userId === userId);
    const result = [];
    
    for (const solve of userSolves) {
      const challenge = await this.getChallenge(solve.challengeId);
      if (challenge) {
        result.push({ ...solve, challenge });
      }
    }
    
    return result;
  }

  async getChallengeSolves(challengeId: number): Promise<(Solve & { user: User })[]> {
    const challengeSolves = Array.from(this.solves.values()).filter(s => s.challengeId === challengeId);
    const result = [];
    
    for (const solve of challengeSolves) {
      const user = await this.getUser(solve.userId);
      if (user) {
        result.push({ ...solve, user });
      }
    }
    
    return result.sort((a, b) => a.solvedAt.getTime() - b.solvedAt.getTime());
  }

  async getLatestSolves(limit = 10): Promise<(Solve & { user: User; challenge: Challenge })[]> {
    const allSolves = Array.from(this.solves.values())
      .sort((a, b) => b.solvedAt.getTime() - a.solvedAt.getTime())
      .slice(0, limit);
    
    const result = [];
    for (const solve of allSolves) {
      const user = await this.getUser(solve.userId);
      const challenge = await this.getChallenge(solve.challengeId);
      if (user && challenge) {
        result.push({ ...solve, user, challenge });
      }
    }
    
    return result;
  }

  async checkFirstBlood(challengeId: number): Promise<boolean> {
    return !Array.from(this.solves.values()).some(s => s.challengeId === challengeId);
  }

  async createFlagSubmission(insertSubmission: InsertFlagSubmission): Promise<FlagSubmission> {
    const id = this.currentSubmissionId++;
    const submission: FlagSubmission = { 
      ...insertSubmission, 
      id, 
      isCorrect: false, 
      submittedAt: new Date() 
    };
    
    const key = `${insertSubmission.userId}-${insertSubmission.challengeId}`;
    const existing = this.flagSubmissions.get(key) || [];
    existing.push(submission);
    this.flagSubmissions.set(key, existing);
    
    return submission;
  }

  async getFlagSubmissions(userId: number, challengeId: number): Promise<FlagSubmission[]> {
    return this.flagSubmissions.get(`${userId}-${challengeId}`) || [];
  }

  async getRateLimit(userId: number, challengeId: number): Promise<RateLimit | undefined> {
    return this.rateLimits.get(`${userId}-${challengeId}`);
  }

  async updateRateLimit(userId: number, challengeId: number, attempts: number, nextAllowedAt?: Date): Promise<RateLimit> {
    const id = this.currentRateLimitId++;
    const rateLimit: RateLimit = {
      id,
      userId,
      challengeId,
      attempts,
      lastAttempt: new Date(),
      nextAllowedAt,
    };
    
    this.rateLimits.set(`${userId}-${challengeId}`, rateLimit);
    return rateLimit;
  }

  async canSubmitFlag(userId: number, challengeId: number): Promise<boolean> {
    const rateLimit = await this.getRateLimit(userId, challengeId);
    if (!rateLimit || !rateLimit.nextAllowedAt) return true;
    
    return new Date() >= rateLimit.nextAllowedAt;
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getAllAuthors(): Promise<Author[]> {
    return Array.from(this.authors.values());
  }

  async getLeaderboard(limit = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getCountryLeaderboard(): Promise<{ country: string; totalScore: number; userCount: number }[]> {
    const countryStats = new Map<string, { totalScore: number; userCount: number }>();
    
    Array.from(this.users.values()).forEach(user => {
      if (user.country) {
        const existing = countryStats.get(user.country) || { totalScore: 0, userCount: 0 };
        existing.totalScore += user.score;
        existing.userCount += 1;
        countryStats.set(user.country, existing);
      }
    });
    
    return Array.from(countryStats.entries())
      .map(([country, stats]) => ({ country, ...stats }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }
}

export const storage = new MemStorage();
