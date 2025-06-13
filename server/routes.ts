import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, 
  loginSchema, 
  adminLoginSchema,
  insertChallengeSchema,
  insertFlagSubmissionSchema 
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "ctf_secret_key_2024";

interface AuthRequest extends Express.Request {
  user?: { id: number; username: string; isAdmin: boolean };
}

// Middleware for authentication
const authenticateToken = async (req: AuthRequest, res: Express.Response, next: Express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = { id: user.id, username: user.username, isAdmin: user.isAdmin };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Middleware for admin authentication
const requireAdmin = (req: AuthRequest, res: Express.Response, next: Express.NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Get country from IP
const getCountryFromIP = (req: Express.Request): string | null => {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0] : req.ip;
  
  // In a real implementation, use a GeoIP service
  // For now, return a placeholder based on common IP patterns
  if (ip?.includes('127.0.0.1') || ip?.includes('localhost')) {
    return 'US'; // Default for local development
  }
  
  // Simulate country detection - in production use actual GeoIP
  const countries = ['US', 'GB', 'DE', 'FR', 'JP', 'CA', 'AU', 'IN', 'BR', 'RU'];
  return countries[Math.floor(Math.random() * countries.length)];
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Get country from IP
      const country = userData.country || getCountryFromIP(req);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        country,
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({
        user: { id: user.id, username: user.username, email: user.email, country: user.country, isAdmin: user.isAdmin },
        token,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({
        user: { id: user.id, username: user.username, email: user.email, country: user.country, isAdmin: user.isAdmin },
        token,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = adminLoginSchema.parse(req.body);
      
      // Simple admin check - in production, this should be more secure
      if (username === "admin" && password === "admin") {
        const token = jwt.sign(
          { id: 0, username: "admin", isAdmin: true },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({
          user: { id: 0, username: "admin", isAdmin: true },
          token,
        });
      } else {
        res.status(401).json({ message: "Invalid admin credentials" });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Admin login failed" });
    }
  });

  app.get("/api/me", authenticateToken, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    
    if (req.user.id === 0) {
      // Admin user
      return res.json({ id: 0, username: "admin", isAdmin: true });
    }
    
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const stats = await storage.getUserStats(user.id);
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      country: user.country,
      bio: user.bio,
      avatar: user.avatar,
      score: user.score,
      isAdmin: user.isAdmin,
      stats,
    });
  });

  // Challenge routes
  app.get("/api/challenges", async (req, res) => {
    try {
      const challenges = await storage.getAllChallenges();
      
      // Add solve count for each challenge
      const challengesWithStats = await Promise.all(
        challenges.map(async (challenge) => {
          const solves = await storage.getChallengeSolves(challenge.id);
          return {
            ...challenge,
            solves: solves.length,
            flag: undefined, // Don't expose flag to frontend
          };
        })
      );
      
      res.json(challengesWithStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch challenges" });
    }
  });

  app.get("/api/challenges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const challenge = await storage.getChallenge(id);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      const solves = await storage.getChallengeSolves(id);
      
      res.json({
        ...challenge,
        solves: solves.length,
        flag: undefined, // Don't expose flag
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch challenge" });
    }
  });

  app.post("/api/challenges/:id/submit", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      
      const challengeId = parseInt(req.params.id);
      const { submittedFlag } = insertFlagSubmissionSchema.pick({ submittedFlag: true }).parse(req.body);
      
      // Check if user can submit (rate limiting)
      const canSubmit = await storage.canSubmitFlag(req.user.id, challengeId);
      if (!canSubmit) {
        return res.status(429).json({ message: "Rate limit exceeded. Please wait before submitting again." });
      }
      
      // Check if already solved
      const existingSolve = await storage.getSolve(req.user.id, challengeId);
      if (existingSolve) {
        return res.status(400).json({ message: "Challenge already solved" });
      }
      
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      const isCorrect = submittedFlag.trim() === challenge.flag.trim();
      
      // Create submission record
      await storage.createFlagSubmission({
        userId: req.user.id,
        challengeId,
        submittedFlag,
        isCorrect,
      });
      
      if (isCorrect) {
        // Create solve record
        await storage.createSolve({
          userId: req.user.id,
          challengeId,
        });
        
        res.json({ 
          correct: true, 
          message: "Correct flag! Challenge solved!",
          points: challenge.points,
        });
      } else {
        // Update rate limiting
        const currentRateLimit = await storage.getRateLimit(req.user.id, challengeId);
        const attempts = (currentRateLimit?.attempts || 0) + 1;
        
        let delay = 5; // 5 seconds for first wrong attempt
        if (attempts >= 2) delay = 10; // 10 seconds for second
        if (attempts >= 3) delay = 15; // 15 seconds for third and beyond
        
        const nextAllowedAt = new Date(Date.now() + delay * 1000);
        await storage.updateRateLimit(req.user.id, challengeId, attempts, nextAllowedAt);
        
        res.json({ 
          correct: false, 
          message: `Incorrect flag. Next attempt allowed in ${delay} seconds.`,
          nextAttemptIn: delay,
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Submission failed" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const stats = await storage.getUserStats(user.id);
          return {
            id: user.id,
            username: user.username,
            country: user.country,
            avatar: user.avatar,
            score: user.score,
            stats,
          };
        })
      );
      
      res.json(usersWithStats.sort((a, b) => b.score - a.score));
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const solves = await storage.getUserSolves(id);
      const stats = await storage.getUserStats(id);
      
      res.json({
        id: user.id,
        username: user.username,
        country: user.country,
        bio: user.bio,
        avatar: user.avatar,
        score: user.score,
        stats,
        solves: solves.map(solve => ({
          ...solve,
          challenge: {
            ...solve.challenge,
            flag: undefined, // Don't expose flag
          },
        })),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch user" });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      
      const leaderboardWithStats = await Promise.all(
        leaderboard.map(async (user, index) => {
          const stats = await storage.getUserStats(user.id);
          return {
            rank: index + 1,
            id: user.id,
            username: user.username,
            country: user.country,
            avatar: user.avatar,
            score: user.score,
            stats,
          };
        })
      );
      
      res.json(leaderboardWithStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/leaderboard/country", async (req, res) => {
    try {
      const countryLeaderboard = await storage.getCountryLeaderboard();
      res.json(countryLeaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch country leaderboard" });
    }
  });

  // Latest solves
  app.get("/api/solves/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const latestSolves = await storage.getLatestSolves(limit);
      
      res.json(latestSolves.map(solve => ({
        id: solve.id,
        solvedAt: solve.solvedAt,
        isFirstBlood: solve.isFirstBlood,
        user: {
          id: solve.user.id,
          username: solve.user.username,
          avatar: solve.user.avatar,
        },
        challenge: {
          id: solve.challenge.id,
          title: solve.challenge.title,
          category: solve.challenge.category,
          points: solve.challenge.points,
        },
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch latest solves" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch categories" });
    }
  });

  // Admin routes
  app.get("/api/admin/challenges", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const challenges = await storage.getAllChallenges();
      res.json(challenges); // Include flags for admin
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch challenges" });
    }
  });

  app.post("/api/admin/challenges", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const challengeData = insertChallengeSchema.parse(req.body);
      const challenge = await storage.createChallenge(challengeData);
      res.json(challenge);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create challenge" });
    }
  });

  app.put("/api/admin/challenges/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertChallengeSchema.partial().parse(req.body);
      const challenge = await storage.updateChallenge(id, updateData);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      res.json(challenge);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update challenge" });
    }
  });

  app.delete("/api/admin/challenges/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteChallenge(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      res.json({ message: "Challenge deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete challenge" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
