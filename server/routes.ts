import type { Request, Response, NextFunction } from "express";
import Express from "express";
import { Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { storage } from "./storage";
import { 
  loginSchema, 
  adminLoginSchema, 
  insertUserSchema,
  insertChallengeSchema,
  insertSolveSchema,
  insertFlagSubmissionSchema,
  type User,
  type Challenge,
  type Solve,
  type FlagSubmission 
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";

interface AuthRequest extends Request {
  user?: { id: number; username: string; isAdmin: boolean };
}

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; isAdmin: boolean };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

export async function registerRoutes(app: Express.Application): Promise<Server> {
  // Rate limiting for flag submissions
  const rateLimitMap = new Map<string, { attempts: number; nextAllowedAt: Date }>();

  const checkRateLimit = async (userId: number, challengeId: number): Promise<boolean> => {
    const key = `${userId}-${challengeId}`;
    const limit = rateLimitMap.get(key);
    
    if (!limit) return true;
    
    return new Date() >= limit.nextAllowedAt;
  };

  const updateRateLimit = (userId: number, challengeId: number, attempts: number) => {
    const key = `${userId}-${challengeId}`;
    const delay = Math.min(5 + (attempts - 1) * 5, 15); // 5s, 10s, 15s max
    const nextAllowedAt = new Date(Date.now() + delay * 1000);
    
    rateLimitMap.set(key, { attempts, nextAllowedAt });
  };

  // Authentication routes
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        country: userData.country || null,
        bio: userData.bio || null,
        avatar: userData.avatar || null,
      });

      const token = jwt.sign(
        { id: user.id, username: user.username, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data" });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = adminLoginSchema.parse(req.body);
      
      // Check for hardcoded admin credentials
      if (username === "admin" && password === "admin") {
        // Create or get admin user
        let adminUser = await storage.getUserByUsername("admin");
        
        if (!adminUser) {
          // Create admin user with hashed password
          const hashedPassword = await bcrypt.hash("admin", 10);
          adminUser = await storage.createUser({
            username: "admin",
            email: "admin@ctf.local",
            password: hashedPassword,
          });
          
          // Update user to be admin (since createUser doesn't accept isAdmin)
          adminUser = await storage.updateUser(adminUser.id, { isAdmin: true }) || adminUser;
        }

        const token = jwt.sign(
          { id: adminUser.id, username: adminUser.username, isAdmin: adminUser.isAdmin },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPassword } = adminUser;
        return res.json({ user: userWithoutPassword, token });
      }
      
      // Fallback to database user lookup
      const user = await storage.getUserByUsername(username);
      if (!user || !user.isAdmin) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // User profile routes
  app.get("/api/me", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const stats = await storage.getUserStats(user.id);
      const { password, ...userWithoutPassword } = user;
      
      res.json({ ...userWithoutPassword, stats });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Challenge routes
  app.get("/api/challenges", async (req: Request, res: Response) => {
    try {
      const challenges = await storage.getAllChallenges();
      
      // Don't expose flags to non-admin users
      const publicChallenges = challenges.map(challenge => {
        const { flag, ...publicChallenge } = challenge;
        return {
          ...publicChallenge,
          solves: 0 // TODO: Calculate actual solve count
        };
      });
      
      res.json(publicChallenges);
    } catch (error) {
      console.error("Get challenges error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/challenges/:id/submit", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const challengeId = parseInt(req.params.id);
      const { flag: submittedFlag } = req.body;

      if (!submittedFlag || typeof submittedFlag !== 'string') {
        return res.status(400).json({ error: "Flag is required" });
      }

      // Check rate limiting
      const canSubmit = await checkRateLimit(req.user.id, challengeId);
      if (!canSubmit) {
        const key = `${req.user.id}-${challengeId}`;
        const limit = rateLimitMap.get(key);
        const waitTime = limit ? Math.ceil((limit.nextAllowedAt.getTime() - Date.now()) / 1000) : 0;
        return res.status(429).json({ 
          error: `Rate limited. Try again in ${waitTime} seconds.`,
          waitTime 
        });
      }

      // Check if already solved
      const existingSolve = await storage.getSolve(req.user.id, challengeId);
      if (existingSolve) {
        return res.status(400).json({ error: "Challenge already solved" });
      }

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      // Get client info for forensics
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      const flagCorrect = submittedFlag.trim() === challenge.flag.trim();
      
      // Record flag submission with forensics data
      await storage.createFlagSubmission({
        userId: req.user.id,
        challengeId,
        submittedFlag,
        isCorrect: flagCorrect,
        ipAddress: clientIp,
        userAgent: userAgent,
      });
      
      if (flagCorrect) {
        // Check for first blood
        const isFirstBlood = await storage.checkFirstBlood(challengeId);
        
        // Create solve record
        await storage.createSolve({
          userId: req.user.id,
          challengeId,
        });

        res.json({ 
          correct: true, 
          message: isFirstBlood ? "Correct! First blood!" : "Correct!",
          points: challenge.points,
          isFirstBlood 
        });
      } else {
        // Update rate limiting
        const submissions = await storage.getFlagSubmissions(req.user.id, challengeId);
        updateRateLimit(req.user.id, challengeId, submissions.length);
        
        res.json({ 
          correct: false, 
          message: "Incorrect flag. Try again.",
          attemptsRemaining: Math.max(0, 5 - submissions.length)
        });
      }
    } catch (error) {
      console.error("Flag submission error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      const users = await storage.getLeaderboard(50);
      const leaderboard = users.map((user, index) => {
        const { password, email, ...publicUser } = user;
        return {
          ...publicUser,
          rank: index + 1,
          stats: { solves: 0 } // TODO: Calculate actual stats
        };
      });
      
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Categories and other data
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/challenges", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const challenges = await storage.getAllChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Get admin challenges error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/challenges", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const challengeData = insertChallengeSchema.parse(req.body);
      const challenge = await storage.createChallenge({
        ...challengeData,
        flagFormat: challengeData.flagFormat || "flag{...}",
        attachmentUrl: challengeData.attachmentUrl || null,
        instanceUrl: challengeData.instanceUrl || null,
        hints: challengeData.hints || null,
        isActive: challengeData.isActive ?? true,
      });
      
      res.status(201).json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      console.error("Create challenge error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/challenges/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const challengeId = parseInt(req.params.id);
      const updates = req.body;
      
      const challenge = await storage.updateChallenge(challengeId, updates);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      res.json(challenge);
    } catch (error) {
      console.error("Update challenge error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/challenges/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const challengeId = parseInt(req.params.id);
      const deleted = await storage.deleteChallenge(challengeId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      res.json({ message: "Challenge deleted successfully" });
    } catch (error) {
      console.error("Delete challenge error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = app.listen(5000, "0.0.0.0", () => {
    console.log("Server running on port 5000");
  });

  return httpServer;
}