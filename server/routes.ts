import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchLiveOdds, fetchAllSportsOdds, getAvailableSports } from "./oddsService";
import { calculateEV, calculateParlay, filterPicksBySport, getTopPicks, filterByMinEV, type ParlayLeg, type EVPick } from "./evCalculator";
import { SUPPORTED_SPORTS, SPORTS_BY_CATEGORY, PREDICTION_CATEGORIES, type SportKey } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import discordRoutes from "./discordRoutes";
import telegramRoutes from "./telegramRoutes";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Subscription tier price mapping (you'll update these with your actual Stripe Price IDs)
const STRIPE_PRICES: Record<string, { priceId: string; name: string; amount: number }> = {
  web: { priceId: process.env.STRIPE_PRICE_WEB || 'price_web', name: 'Web Tier', amount: 999 },
  premium: { priceId: process.env.STRIPE_PRICE_PREMIUM || 'price_premium', name: 'Premium Tier', amount: 1999 },
  elite: { priceId: process.env.STRIPE_PRICE_ELITE || 'price_elite', name: 'Elite Tier', amount: 4999 },
};

// Admin key from environment (secure - no fallback)
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
const JWT_SECRET = process.env.SESSION_SECRET;

// Middleware to require specific role access
const requireRole = (roles: string[]) => async (req: Request, res: Response, next: NextFunction) => {
  // First check x-admin-key header - if provided and valid, bypass role check (treat as super_admin)
  const adminKey = req.headers['x-admin-key'];
  if (ADMIN_SECRET_KEY && adminKey === ADMIN_SECRET_KEY) {
    return next();
  }
  
  // Then check if user is authenticated via JWT and has required role
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && JWT_SECRET) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      const user = await storage.getUser(decoded.userId);
      
      if (user && (roles.includes(user.role || 'user') || user.role === 'super_admin')) {
        (req as any).user = user;
        return next();
      }
    }
  } catch (error) {
    // JWT verification failed
  }
  
  return res.status(403).json({ error: 'Unauthorized: Required role not met' });
};

// Legacy middleware for backward compatibility, now uses requireRole
const requireAdmin = requireRole(['admin', 'super_admin']);
const requireSuperAdmin = requireRole(['super_admin']);

// In-memory cache for odds data (refreshed periodically)
let cachedOdds: { data: EVPick[]; lastUpdated: Date } = {
  data: [],
  lastUpdated: new Date(0),
};

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;

async function refreshOddsCache(): Promise<void> {
  try {
    console.log("🔄 Refreshing odds cache...");
    const allOdds = await fetchAllSportsOdds();
    const evPicks = calculateEV(allOdds);
    cachedOdds = {
      data: evPicks,
      lastUpdated: new Date(),
    };
    console.log(`✅ Cache refreshed with ${evPicks.length} EV picks`);
  } catch (error) {
    console.error("❌ Failed to refresh odds cache:", error);
  }
}

function isCacheStale(): boolean {
  return Date.now() - cachedOdds.lastUpdated.getTime() > CACHE_DURATION_MS;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      cacheAge: Date.now() - cachedOdds.lastUpdated.getTime(),
      picksCount: cachedOdds.data.length,
      version: "2.0.0",
      features: {
        sports_betting: true,
        prediction_markets: true,
        promo_codes: true,
        ambassador_program: true,
        user_auth: true,
        admin_dashboard: true,
        polymarket: true,
      },
      sports_count: Object.values(SPORTS_BY_CATEGORY).flat().length,
    });
  });

  // Get available sports
  app.get("/api/sports", async (req: Request, res: Response) => {
    try {
      const sports = await getAvailableSports();
      res.json(sports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sports" });
    }
  });

  // Get live odds for a specific sport
  app.get("/api/odds/live", async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as SportKey) || "basketball_nba";
      
      // Validate sport
      const validSport = SUPPORTED_SPORTS.find(s => s.key === sport);
      if (!validSport) {
        return res.status(400).json({ error: "Invalid sport key" });
      }
      
      const result = await fetchLiveOdds(sport);
      res.json({
        sport: validSport,
        games: result.data,
        apiUsage: {
          remaining: result.remainingRequests,
          used: result.usedRequests,
        },
      });
    } catch (error) {
      console.error("Error fetching live odds:", error);
      res.status(500).json({ error: "Failed to fetch live odds" });
    }
  });

  // Get EV picks (the main value calculation endpoint)
  app.get("/api/picks/ev", async (req: Request, res: Response) => {
    try {
      // Refresh cache if stale
      if (isCacheStale() || cachedOdds.data.length === 0) {
        await refreshOddsCache();
      }
      
      const sport = req.query.sport as string || "all";
      const limit = parseInt(req.query.limit as string) || 20;
      const minEV = parseFloat(req.query.minEV as string) || 0;
      
      let picks = cachedOdds.data;
      
      // Filter by sport
      if (sport !== "all") {
        picks = filterPicksBySport(picks, sport);
      }
      
      // Filter by minimum EV
      if (minEV > 0) {
        picks = filterByMinEV(picks, minEV);
      }
      
      // Limit results
      picks = getTopPicks(picks, limit);
      
      res.json({
        picks,
        total: picks.length,
        cacheAge: Date.now() - cachedOdds.lastUpdated.getTime(),
        lastUpdated: cachedOdds.lastUpdated.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching EV picks:", error);
      res.status(500).json({ error: "Failed to fetch EV picks" });
    }
  });

  // Get top picks of the day
  app.get("/api/picks/top", async (req: Request, res: Response) => {
    try {
      // Refresh cache if stale
      if (isCacheStale() || cachedOdds.data.length === 0) {
        await refreshOddsCache();
      }
      
      const sport = req.query.sport as string || "all";
      const limit = parseInt(req.query.limit as string) || 10;
      
      let picks = cachedOdds.data;
      
      // Filter by sport
      if (sport !== "all") {
        picks = filterPicksBySport(picks, sport);
      }
      
      // Get top picks (already sorted by EV)
      const topPicks = picks.slice(0, limit).map((pick, index) => ({
        ...pick,
        rank: index + 1,
      }));
      
      res.json({
        picks: topPicks,
        sport,
        lastUpdated: cachedOdds.lastUpdated.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching top picks:", error);
      res.status(500).json({ error: "Failed to fetch top picks" });
    }
  });

  // Calculate parlay odds
  app.post("/api/parlay/calculate", (req: Request, res: Response) => {
    try {
      const { picks, betAmount = 100 } = req.body as { picks: ParlayLeg[]; betAmount?: number };
      
      if (!picks || !Array.isArray(picks) || picks.length === 0) {
        return res.status(400).json({ error: "No picks provided" });
      }
      
      if (picks.length > 15) {
        return res.status(400).json({ error: "Maximum 15 legs allowed in a parlay" });
      }
      
      const result = calculateParlay(picks, betAmount);
      res.json(result);
    } catch (error) {
      console.error("Error calculating parlay:", error);
      res.status(500).json({ error: "Failed to calculate parlay" });
    }
  });

  // Manual cache refresh (for admin/testing)
  app.post("/api/admin/refresh-odds", requireAdmin, async (req: Request, res: Response) => {
    try {
      await refreshOddsCache();
      res.json({
        success: true,
        picksCount: cachedOdds.data.length,
        lastUpdated: cachedOdds.lastUpdated.toISOString(),
      });
    } catch (error) {
      console.error("Error refreshing odds:", error);
      res.status(500).json({ error: "Failed to refresh odds" });
    }
  });

  // Admin Management Endpoints
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const usersList = await storage.getAllUsers();
      // Remove sensitive info like passwordHash
      const sanitizedUsers = usersList.map(({ passwordHash, ...u }) => u);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (!['user', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'user', 'moderator', or 'admin'." });
      }

      // Update role and set isAdmin flag accordingly
      const isAdmin = role === 'admin' || role === 'super_admin';
      const updatedUser = await storage.updateUser(userId, { role, isAdmin });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Auto-assign MVP badge for admins/moderators
      if (role === 'admin' || role === 'moderator') {
        try {
          await storage.assignBadge(userId, 'mvp');
        } catch (badgeError) {
          console.log('Badge assignment skipped:', badgeError);
        }
      }

      const { passwordHash, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Get odds comparison for a specific matchup
  app.get("/api/odds/compare", async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as SportKey) || "basketball_nba";
      
      const result = await fetchLiveOdds(sport);
      
      // Transform data into comparison format
      const comparisons = result.data.map(game => {
        const bookmakers: Record<string, Record<string, number>> = {};
        
        for (const bookmaker of game.bookmakers) {
          bookmakers[bookmaker.title] = {};
          for (const market of bookmaker.markets) {
            for (const outcome of market.outcomes) {
              const key = `${outcome.name}_${outcome.point ?? 'ML'}`;
              bookmakers[bookmaker.title][key] = outcome.price;
            }
          }
        }
        
        return {
          id: game.id,
          game: `${game.home_team} vs ${game.away_team}`,
          commenceTime: game.commence_time,
          bookmakers,
        };
      });
      
      res.json({ comparisons });
    } catch (error) {
      console.error("Error fetching odds comparison:", error);
      res.status(500).json({ error: "Failed to fetch odds comparison" });
    }
  });

  // Get user subscription status (placeholder - needs auth)
  app.get("/api/user/subscription", (req: Request, res: Response) => {
    // For now, return a mock response
    // TODO: Implement with actual auth
    res.json({
      tier: "free",
      status: "active",
      features: {
        dailyPicks: 2,
        liveData: false,
        evRankings: false,
        parlayBuilder: true,
        discordBot: false,
        alerts: false,
      },
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // POLYMARKET ROUTES
  // ═══════════════════════════════════════════════════════════════

  // Get Polymarket prediction markets
  app.get("/api/polymarket/markets", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string || "all";
      const limit = parseInt(req.query.limit as string) || 20;

      // Mock data for Polymarket markets (in production, this would fetch from Polymarket API)
      const mockMarkets = [
        {
          id: "pm-1",
          question: "Will Bitcoin reach $100,000 by end of 2025?",
          description: "This market resolves YES if Bitcoin price reaches $100,000 USD on any major exchange before December 31, 2025.",
          outcomes: [
            { name: "Yes", price: 0.62 },
            { name: "No", price: 0.38 },
          ],
          volume: 2450000,
          liquidity: 850000,
          endDate: "2025-12-31T23:59:59Z",
          category: "economics",
          url: "https://polymarket.com/event/bitcoin-100k-2025",
        },
        {
          id: "pm-2",
          question: "Will there be a US recession in 2025?",
          description: "Market resolves YES if NBER officially declares a recession starting in 2025.",
          outcomes: [
            { name: "Yes", price: 0.28 },
            { name: "No", price: 0.72 },
          ],
          volume: 1850000,
          liquidity: 620000,
          endDate: "2026-06-30T23:59:59Z",
          category: "economics",
          url: "https://polymarket.com/event/us-recession-2025",
        },
        {
          id: "pm-3",
          question: "Super Bowl LIX Winner?",
          description: "Which team will win Super Bowl LIX?",
          outcomes: [
            { name: "Kansas City Chiefs", price: 0.22 },
            { name: "Other", price: 0.78 },
          ],
          volume: 3200000,
          liquidity: 980000,
          endDate: "2025-02-09T23:59:59Z",
          category: "sports_events",
          url: "https://polymarket.com/event/super-bowl-lix",
        },
        {
          id: "pm-4",
          question: "Will GPT-5 be released in 2025?",
          description: "Market resolves YES if OpenAI releases GPT-5 or equivalent successor model in 2025.",
          outcomes: [
            { name: "Yes", price: 0.75 },
            { name: "No", price: 0.25 },
          ],
          volume: 1120000,
          liquidity: 340000,
          endDate: "2025-12-31T23:59:59Z",
          category: "science",
          url: "https://polymarket.com/event/gpt-5-2025",
        },
        {
          id: "pm-5",
          question: "Will the Fed cut rates by March 2025?",
          description: "Market resolves YES if the Federal Reserve cuts the federal funds rate by March 31, 2025.",
          outcomes: [
            { name: "Yes", price: 0.85 },
            { name: "No", price: 0.15 },
          ],
          volume: 890000,
          liquidity: 280000,
          endDate: "2025-03-31T23:59:59Z",
          category: "economics",
          url: "https://polymarket.com/event/fed-rate-cut-march-2025",
        },
        {
          id: "pm-6",
          question: "Oscar Best Picture 2025?",
          description: "Which film will win Best Picture at the 2025 Academy Awards?",
          outcomes: [
            { name: "Wicked", price: 0.35 },
            { name: "Other", price: 0.65 },
          ],
          volume: 560000,
          liquidity: 180000,
          endDate: "2025-03-02T23:59:59Z",
          category: "entertainment",
          url: "https://polymarket.com/event/oscar-best-picture-2025",
        },
      ];

      // Filter by category if specified
      let filteredMarkets = mockMarkets;
      if (category !== "all") {
        filteredMarkets = mockMarkets.filter(m => m.category === category);
      }

      // Apply limit
      filteredMarkets = filteredMarkets.slice(0, limit);

      res.json({
        markets: filteredMarkets,
        total: filteredMarkets.length,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching Polymarket data:", error);
      res.status(500).json({ error: "Failed to fetch prediction markets" });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // AMBASSADOR ROUTES
  // ═══════════════════════════════════════════════════════════════

  app.get("/api/admin/ambassadors", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ambassadors = await storage.getAllAmbassadors();
      // Fetch user details for each ambassador
      const ambassadorsWithUser = await Promise.all(ambassadors.map(async (amb) => {
        const user = await storage.getUser(amb.userId!);
        return {
          ...amb,
          user: user ? { email: user.email, username: user.username } : null
        };
      }));
      res.json(ambassadorsWithUser);
    } catch (error) {
      console.error("Error fetching ambassadors:", error);
      res.status(500).json({ error: "Failed to fetch ambassadors" });
    }
  });

  app.post("/api/admin/ambassador/create", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId, referralCode, commissionPercent } = req.body;
      
      if (!userId || !referralCode) {
        return res.status(400).json({ error: "User ID and referral code are required" });
      }

      const existingAmbassador = await storage.getAmbassadorByUserId(userId);
      if (existingAmbassador) {
        return res.status(400).json({ error: "User is already an ambassador" });
      }

      const newAmbassador = await storage.createAmbassador({
        userId,
        referralCode: referralCode.toUpperCase(),
        commissionPercent: commissionPercent?.toString() || "10",
        active: true
      });

      // Auto-assign MVP badge to ambassador
      try {
        await storage.assignBadge(userId, 'mvp');
      } catch (badgeError) {
        console.log('Badge assignment skipped:', badgeError);
      }

      res.json(newAmbassador);
    } catch (error) {
      console.error("Error creating ambassador:", error);
      res.status(500).json({ error: "Failed to create ambassador" });
    }
  });

  app.post("/api/admin/ambassadors/:id/payout", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const ambassadorId = parseInt(req.params.id);
      const { amount, payoutMethod } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid payout amount" });
      }

      const payout = await storage.createAmbassadorPayout({
        ambassadorId,
        amount: amount.toString(),
        payoutMethod: payoutMethod || 'manual',
        status: 'pending',
        notes: 'Manual payout processed via admin dashboard'
      });

      res.json(payout);
    } catch (error) {
      console.error("Error processing payout:", error);
      res.status(500).json({ error: "Failed to process payout" });
    }
  });

  app.get("/api/admin/ambassadors/:id/payouts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ambassadorId = parseInt(req.params.id);
      const payouts = await storage.getAmbassadorPayouts(ambassadorId);
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ error: "Failed to fetch payouts" });
    }
  });

  app.get("/api/admin/ambassadors/:id/referrals", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ambassadorId = parseInt(req.params.id);
      const referrals = await storage.getAmbassadorReferrals(ambassadorId);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  app.get("/api/admin/ambassador-stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getAmbassadorStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching ambassador stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.patch("/api/admin/payouts/:id/complete", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const payoutId = parseInt(req.params.id);
      const { reference = 'Completed by Admin' } = req.body;

      await storage.markAmbassadorPayoutCompleted(payoutId, reference);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing payout:", error);
      res.status(500).json({ error: "Failed to complete payout" });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // AUTH ROUTES
  // ═══════════════════════════════════════════════════════════════
  
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, username, referralCode } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // Hash password with bcrypt
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user in database
      const newUser = await storage.createUser({
        email: email.toLowerCase(),
        username: username || email.split('@')[0],
        passwordHash,
        referredByCode: referralCode || undefined,
        subscriptionTier: 'free',
        subscriptionStatus: 'inactive',
      });
      
      // Generate JWT token
      if (!JWT_SECRET) {
        return res.status(500).json({ error: 'Server configuration error' });
      }
      const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
      
      console.log(`✅ User registered: ${email}`);
      
      res.json({
        success: true,
        message: 'Account created successfully',
        user: { 
          id: newUser.id,
          email: newUser.email, 
          username: newUser.username, 
          subscriptionTier: newUser.subscriptionTier,
          isAdmin: newUser.isAdmin,
        },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, username, password, rememberMe } = req.body;
      
      if ((!email && !username) || !password) {
        return res.status(400).json({ error: 'Email/username and password required' });
      }
      
      // Lookup user by email or username in database
      let user = null;
      if (email) {
        user = await storage.getUserByEmail(email.toLowerCase());
      } else if (username) {
        user = await storage.getUserByUsername(username);
      }
      
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verify password hash with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token - 30 days if rememberMe, otherwise 7 days
      if (!JWT_SECRET) {
        return res.status(500).json({ error: 'Server configuration error' });
      }
      const tokenExpiry = rememberMe ? '30d' : '7d';
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: tokenExpiry });
      
      console.log(`✅ User logged in: ${email}`);
      
      // Derive isAdmin from role
      const isAdmin = user.isAdmin || user.role === 'admin' || user.role === 'super_admin';
      const effectiveTier = isAdmin ? 'elite' : user.subscriptionTier;
      
      res.json({
        success: true,
        user: { 
          id: user.id,
          email: user.email,
          username: user.username,
          subscriptionTier: effectiveTier,
          actualTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          isAdmin,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      // Extract JWT from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const token = authHeader.substring(7);
      
      if (!JWT_SECRET) {
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      
      // Get user from database
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Derive isAdmin from role (admin or super_admin are admins)
      const isAdmin = user.isAdmin || user.role === 'admin' || user.role === 'super_admin';
      
      // Admins get full access regardless of subscription tier
      const effectiveTier = isAdmin ? 'elite' : user.subscriptionTier;
      
      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: effectiveTier,
        actualTier: user.subscriptionTier, // Real tier for display purposes
        subscriptionStatus: user.subscriptionStatus,
        isAdmin,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        theme: user.theme,
        isLifetime: user.isLifetime,
      });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // Save user sportsbook preferences (for marketing/community data)
  const VALID_SPORTSBOOK_IDS = [
    'draftkings', 'fanduel', 'betmgm', 'caesars', 'pointsbet', 'bet365',
    'barstool', 'betrivers', 'unibet', 'hard_rock', 'prizepicks', 'underdog', 'sleeper', 'other'
  ];
  
  app.post("/api/user/sportsbook-preferences", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ') || !JWT_SECRET) {
        // For unauthenticated users, just acknowledge the request without saving
        // This handles new users during onboarding who may not have a token yet
        return res.json({ success: true, saved: false, message: 'Preferences noted (login required to save)' });
      }
      
      const token = authHeader.substring(7);
      let decoded: { userId: number; email: string };
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      } catch {
        return res.json({ success: true, saved: false, message: 'Preferences noted (invalid token)' });
      }
      
      const { sportsbooks } = req.body;
      if (!Array.isArray(sportsbooks)) {
        return res.status(400).json({ error: 'Sportsbooks must be an array' });
      }
      
      // Validate sportsbook IDs
      const validSportsbooks = sportsbooks.filter(id => VALID_SPORTSBOOK_IDS.includes(id));
      
      // Update user with sportsbook preferences
      await storage.updateUser(decoded.userId, {
        preferredSportsbooks: validSportsbooks,
      });
      
      console.log(`✅ Sportsbook preferences saved for user ${decoded.userId}:`, validSportsbooks);
      
      res.json({ success: true, saved: true, sportsbooks: validSportsbooks });
    } catch (error) {
      console.error('Error saving sportsbook preferences:', error);
      res.status(500).json({ error: 'Failed to save preferences' });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // STRIPE PAYMENT ROUTES
  // ═══════════════════════════════════════════════════════════════

  // Create checkout session for subscription
  app.post("/api/stripe/create-checkout", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Payment system not configured' });
      }

      const { tier, userId } = req.body;
      
      if (!tier || !STRIPE_PRICES[tier]) {
        return res.status(400).json({ error: 'Invalid subscription tier' });
      }

      // Get user if userId provided
      let customer: string | undefined;
      let userEmail: string | undefined;
      
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          userEmail = user.email;
          if (user.stripeCustomerId) {
            customer = user.stripeCustomerId;
          }
        }
      }

      const priceInfo = STRIPE_PRICES[tier];
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: customer,
        customer_email: customer ? undefined : userEmail,
        line_items: [
          {
            price: priceInfo.priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId?.toString() || '',
          tier,
        },
        success_url: `${req.headers.origin || 'https://mvp.replit.app'}/dashboard?payment=success&tier=${tier}`,
        cancel_url: `${req.headers.origin || 'https://mvp.replit.app'}/dashboard?payment=cancelled`,
      });

      res.json({ 
        sessionId: session.id, 
        url: session.url,
      });
    } catch (error) {
      console.error('Stripe checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Create checkout session for ambassador program ($749 one-time payment)
  app.post("/api/stripe/create-ambassador-checkout", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Payment system not configured' });
      }

      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if already an ambassador
      const existingAmbassador = await storage.getAmbassadorByUserId(userId);
      if (existingAmbassador) {
        return res.status(400).json({ error: 'Already an ambassador' });
      }

      // Check ambassador limit (50 founding ambassadors)
      const ambassadors = await storage.getAllAmbassadors();
      if (ambassadors.length >= 50) {
        return res.status(400).json({ error: 'Ambassador program is currently full' });
      }

      // Ambassador price ID from env or use price_data for one-time
      const ambassadorPriceId = process.env.STRIPE_PRICE_AMBASSADOR;
      
      // Create checkout session for one-time payment
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        mode: 'payment',
        customer: user.stripeCustomerId || undefined,
        customer_email: user.stripeCustomerId ? undefined : user.email,
        metadata: {
          userId: userId.toString(),
          type: 'ambassador',
        },
        success_url: `${req.headers.origin || 'https://mvp.replit.app'}/dashboard?payment=success&type=ambassador`,
        cancel_url: `${req.headers.origin || 'https://mvp.replit.app'}/ambassador?payment=cancelled`,
        line_items: ambassadorPriceId 
          ? [{ price: ambassadorPriceId, quantity: 1 }]
          : [{
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'MVP Ambassador Program',
                  description: 'Lifetime Elite access + 20% recurring commission on all referrals',
                },
                unit_amount: 74900, // $749.00 in cents
              },
              quantity: 1,
            }],
      };

      const session = await stripe.checkout.sessions.create(sessionConfig);

      res.json({ 
        sessionId: session.id, 
        url: session.url,
      });
    } catch (error) {
      console.error('Ambassador checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Get subscription status
  app.get("/api/stripe/subscription/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        stripeCustomerId: user.stripeCustomerId,
      });
    } catch (error) {
      console.error('Subscription status error:', error);
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  });

  // Stripe webhook handler
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Payment system not configured' });
      }

      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      let event: Stripe.Event;

      if (webhookSecret && sig) {
        try {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
          console.error('Webhook signature verification failed:', err);
          return res.status(400).json({ error: 'Webhook signature verification failed' });
        }
      } else {
        // For testing without webhook secret
        event = req.body as Stripe.Event;
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const tier = session.metadata?.tier;
          const checkoutType = session.metadata?.type;
          
          // Handle ambassador purchase
          if (checkoutType === 'ambassador' && userId) {
            try {
              const userIdNum = parseInt(userId);
              const user = await storage.getUser(userIdNum);
              
              if (user) {
                // Generate unique referral code
                const referralCode = `MVP${user.username?.toUpperCase().substring(0, 4) || 'AMB'}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                
                // Create ambassador record
                const ambassador = await storage.createAmbassador({
                  userId: userIdNum,
                  referralCode,
                  commissionPercent: "20.00",
                  payoutThreshold: "25.00",
                  purchaseAmount: "749.00",
                  active: true,
                  tier: 'rookie',
                });
                
                // Grant lifetime Elite access
                await storage.updateUserSubscription(userIdNum, 'elite', 'active');
                
                // Update stripe customer ID if new
                if (session.customer) {
                  await storage.updateUserStripeCustomerId(userIdNum, session.customer as string);
                }
                
                console.log(`🎉 New Ambassador created: ${user.username} (${referralCode}) - Lifetime Elite granted`);
              }
            } catch (ambassadorCreateError) {
              console.error('Error creating ambassador:', ambassadorCreateError);
            }
            break;
          }
          
          if (userId && tier) {
            // Update user subscription
            await storage.updateUserSubscription(parseInt(userId), tier, 'active');
            
            // Update stripe customer ID if new
            if (session.customer) {
              await storage.updateUserStripeCustomerId(parseInt(userId), session.customer as string);
            }
            
            console.log(`✅ Subscription activated: User ${userId} -> ${tier}`);
            
            // Check for ambassador referral and credit commission
            try {
              const user = await storage.getUser(parseInt(userId));
              if (user?.referredByCode) {
                const ambassador = await storage.getAmbassadorByCode(user.referredByCode);
                if (ambassador && ambassador.active) {
                  // Get subscription amount from tier
                  const tierInfo = STRIPE_PRICES[tier];
                  const subscriptionAmount = tierInfo ? tierInfo.amount / 100 : 0; // Convert cents to dollars
                  
                  // Calculate commission
                  const commissionPercent = parseFloat(ambassador.commissionPercent?.toString() || '10');
                  const commissionEarned = subscriptionAmount * (commissionPercent / 100);
                  
                  if (commissionEarned > 0) {
                    // Update ambassador earnings
                    await storage.updateAmbassadorEarnings(ambassador.id, commissionEarned);
                    
                    // Create referral record with tier for bonus tracking
                    await storage.createAmbassadorReferral(
                      ambassador.id,
                      parseInt(userId),
                      subscriptionAmount,
                      commissionEarned,
                      tier
                    );
                    
                    console.log(`💰 Ambassador ${ambassador.referralCode} credited $${commissionEarned.toFixed(2)} for referral (${tier})`);
                    
                    // Check for bonus milestones
                    const bonus = await storage.checkAndAwardBonusMilestones(ambassador.id);
                    if (bonus) {
                      console.log(`🎁 Ambassador ${ambassador.referralCode} earned $${bonus.amount} bonus for ${bonus.bonusType}!`);
                    }
                    
                    // Update ambassador tier
                    const newTier = await storage.updateAmbassadorTier(ambassador.id);
                    console.log(`📊 Ambassador ${ambassador.referralCode} tier: ${newTier}`);
                  }
                }
              }
            } catch (ambassadorError) {
              console.error('Error processing ambassador referral:', ambassadorError);
              // Don't fail the webhook for ambassador errors
            }
          }
          break;
        }
        
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          // Find user by stripe customer ID and update status
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (user) {
            const status = subscription.status === 'active' ? 'active' : 'inactive';
            await storage.updateUserSubscription(user.id, user.subscriptionTier || 'free', status);
            console.log(`📝 Subscription updated: User ${user.id} -> ${status}`);
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          // Find user and downgrade to free
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (user) {
            await storage.updateUserSubscription(user.id, 'free', 'inactive');
            console.log(`❌ Subscription cancelled: User ${user.id}`);
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Customer portal for managing subscription
  app.post("/api/stripe/customer-portal", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Payment system not configured' });
      }

      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: 'No active subscription found' });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin || 'https://mvp.replit.app'}/dashboard`,
      });

      res.json({ url: portalSession.url });
    } catch (error) {
      console.error('Customer portal error:', error);
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // PROMO CODE ROUTES
  // ═══════════════════════════════════════════════════════════════
  
  app.post("/api/promo/validate", async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ valid: false, error: 'Promo code required' });
      }
      
      // TODO: Check promo code in database
      // For now, return sample validation
      const upperCode = code.toUpperCase();
      
      // Sample promo codes for testing
      const sampleCodes: Record<string, { discountType: string; discountValue: number; message: string }> = {
        'LAUNCH50': { discountType: 'percentage', discountValue: 50, message: '50% off your first month!' },
        'FREEMONTH': { discountType: 'trial_days', discountValue: 30, message: '30 days free trial!' },
        'SAVE10': { discountType: 'percentage', discountValue: 10, message: '10% off!' },
      };
      
      if (sampleCodes[upperCode]) {
        res.json({
          valid: true,
          code: upperCode,
          ...sampleCodes[upperCode]
        });
      } else {
        res.json({ valid: false, error: 'Invalid promo code' });
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      res.status(500).json({ valid: false, error: 'Validation failed' });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // POLYMARKET INTEGRATION
  // ═══════════════════════════════════════════════════════════════
  
  app.get("/api/polymarket/markets", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string || 'all';
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Fetch from Polymarket API
      const response = await fetch(`https://gamma-api.polymarket.com/markets?limit=${limit}&active=true`);
      
      if (!response.ok) {
        throw new Error('Polymarket API unavailable');
      }
      
      const markets = await response.json();
      
      // Transform to our format
      const formatted = markets.map((m: any) => ({
        id: m.id,
        question: m.question,
        category: m.groupItemTitle || 'General',
        volume: parseFloat(m.volume || 0),
        yesPrice: parseFloat(m.outcomePrices?.[0] || 0.5),
        noPrice: 1 - parseFloat(m.outcomePrices?.[0] || 0.5),
        yesPercent: Math.round(parseFloat(m.outcomePrices?.[0] || 0.5) * 100),
        noPercent: Math.round((1 - parseFloat(m.outcomePrices?.[0] || 0.5)) * 100),
        url: `https://polymarket.com/event/${m.slug}`,
        endDate: m.endDateIso,
        liquidity: parseFloat(m.liquidity || 0),
      }));
      
      res.json({
        markets: formatted,
        total: formatted.length,
        categories: PREDICTION_CATEGORIES,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Polymarket fetch error:', error);
      // Return mock data when API unavailable
      res.json({
        markets: [
          {
            id: 'mock-1',
            question: 'Will BTC reach $150k by end of 2025?',
            category: 'Economics',
            volume: 2500000,
            yesPrice: 0.35,
            noPrice: 0.65,
            yesPercent: 35,
            noPercent: 65,
            url: 'https://polymarket.com',
          },
          {
            id: 'mock-2',
            question: 'Will the Fed cut rates in Q1 2025?',
            category: 'Economics',
            volume: 1800000,
            yesPrice: 0.72,
            noPrice: 0.28,
            yesPercent: 72,
            noPercent: 28,
            url: 'https://polymarket.com',
          },
        ],
        total: 2,
        categories: PREDICTION_CATEGORIES,
        lastUpdated: new Date().toISOString(),
        mock: true,
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // EXPANDED SPORTS LIST
  // ═══════════════════════════════════════════════════════════════
  
  app.get("/api/sports/all", (req: Request, res: Response) => {
    res.json({
      categories: SPORTS_BY_CATEGORY,
      totalSports: Object.values(SPORTS_BY_CATEGORY).flat().length,
      predictionMarkets: PREDICTION_CATEGORIES,
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ENHANCED ADMIN ROUTES
  // ═══════════════════════════════════════════════════════════════
  
  // Admin: Get all users (paginated)
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      // TODO: Get users from database with pagination
      res.json({
        users: [
          { id: 1, email: 'user1@example.com', subscriptionTier: 'premium', createdAt: new Date() },
          { id: 2, email: 'user2@example.com', subscriptionTier: 'free', createdAt: new Date() },
        ],
        total: 2,
        page,
        limit,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Admin: Create promo code
  app.post("/api/admin/promo/create", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { code, discountType, discountValue, maxUses, validUntil } = req.body;
      
      if (!code || !discountType || !discountValue) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // TODO: Create promo in database
      
      res.json({
        success: true,
        promo: {
          code: code.toUpperCase(),
          discountType,
          discountValue,
          maxUses,
          validUntil,
          active: true,
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create promo' });
    }
  });

  // Admin: Create ambassador
  app.post("/api/admin/ambassador/create", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { email, referralCode, commissionPercent } = req.body;
      
      if (!email || !referralCode) {
        return res.status(400).json({ error: 'Email and referral code required' });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(404).json({ error: 'User with this email not found' });
      }
      
      // Check if ambassador already exists
      const existingAmbassador = await storage.getAmbassadorByUserId(user.id);
      if (existingAmbassador) {
        return res.status(400).json({ error: 'User is already an ambassador' });
      }
      
      // Check if referral code is already taken
      const existingCode = await storage.getAmbassadorByCode(referralCode);
      if (existingCode) {
        return res.status(400).json({ error: 'Referral code already in use' });
      }
      
      // Create ambassador in database
      const ambassador = await storage.createAmbassador({
        userId: user.id,
        referralCode: referralCode.toUpperCase(),
        commissionPercent: commissionPercent?.toString() || '10',
        active: true,
      });
      
      // Auto-assign MVP badge to ambassador
      try {
        await storage.assignBadge(user.id, 'mvp');
      } catch (badgeError) {
        console.log('Badge assignment skipped:', badgeError);
      }
      
      console.log(`✅ Ambassador created: ${email} with code ${referralCode.toUpperCase()}`);
      
      res.json({
        success: true,
        ambassador: {
          id: ambassador.id,
          email,
          referralCode: ambassador.referralCode,
          commissionPercent: ambassador.commissionPercent,
          active: ambassador.active,
        }
      });
    } catch (error) {
      console.error('Failed to create ambassador:', error);
      res.status(500).json({ error: 'Failed to create ambassador' });
    }
  });

  // Admin: List all ambassadors
  app.get("/api/admin/ambassadors", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ambassadorsList = await storage.getAllAmbassadors();
      
      // Enrich with user data
      const enrichedAmbassadors = await Promise.all(
        ambassadorsList.map(async (ambassador) => {
          const user = ambassador.userId ? await storage.getUser(ambassador.userId) : null;
          return {
            ...ambassador,
            email: user?.email,
            username: user?.username,
          };
        })
      );
      
      res.json(enrichedAmbassadors);
    } catch (error) {
      console.error('Failed to fetch ambassadors:', error);
      res.status(500).json({ error: 'Failed to fetch ambassadors' });
    }
  });

  // Admin: Get payout history for an ambassador
  app.get("/api/admin/ambassadors/:id/payouts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ambassadorId = parseInt(req.params.id);
      
      if (isNaN(ambassadorId)) {
        return res.status(400).json({ error: 'Invalid ambassador ID' });
      }
      
      const payouts = await storage.getAmbassadorPayouts(ambassadorId);
      res.json(payouts);
    } catch (error) {
      console.error('Failed to fetch ambassador payouts:', error);
      res.status(500).json({ error: 'Failed to fetch payouts' });
    }
  });

  // Admin: Create a new payout record
  app.post("/api/admin/ambassadors/:id/payout", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const ambassadorId = parseInt(req.params.id);
      const { amount, payoutMethod, notes, periodStart, periodEnd } = req.body;
      
      if (isNaN(ambassadorId)) {
        return res.status(400).json({ error: 'Invalid ambassador ID' });
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Valid amount required' });
      }
      
      const payout = await storage.createAmbassadorPayout({
        ambassadorId,
        amount: amount.toString(),
        payoutMethod: payoutMethod || 'manual',
        notes,
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
        status: 'pending',
      });
      
      console.log(`✅ Payout created for ambassador ${ambassadorId}: $${amount}`);
      
      res.json({
        success: true,
        payout,
      });
    } catch (error) {
      console.error('Failed to create payout:', error);
      res.status(500).json({ error: 'Failed to create payout' });
    }
  });

  // Admin: Mark payout as completed
  app.patch("/api/admin/payouts/:id/complete", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const payoutId = parseInt(req.params.id);
      const { reference } = req.body;
      
      if (isNaN(payoutId)) {
        return res.status(400).json({ error: 'Invalid payout ID' });
      }
      
      if (!reference) {
        return res.status(400).json({ error: 'Payment reference required' });
      }
      
      await storage.markAmbassadorPayoutCompleted(payoutId, reference);
      
      console.log(`✅ Payout ${payoutId} marked as completed with reference: ${reference}`);
      
      res.json({
        success: true,
        message: 'Payout marked as completed',
      });
    } catch (error) {
      console.error('Failed to complete payout:', error);
      res.status(500).json({ error: 'Failed to complete payout' });
    }
  });

  // Admin: Get system stats (old format)
  app.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      res.json({
        users: {
          total: 150,
          premium: 45,
          web: 80,
          free: 25,
        },
        revenue: {
          mrr: 1450,
          activeSubscriptions: 125,
        },
        api: {
          oddsApiCallsToday: 24,
          oddsApiRemaining: 476,
        },
        picks: {
          totalEVPicks: cachedOdds.data.length,
          lastUpdate: cachedOdds.lastUpdated,
        },
        ambassadors: {
          total: 5,
          totalReferrals: 32,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Admin: Dashboard stats (for frontend admin dashboard)
  app.get("/api/admin/dashboard", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get real user counts from database
      const allUsers = await storage.getAllUsers();
      
      const userCounts = {
        total: allUsers.length,
        elite: allUsers.filter(u => u.subscriptionTier === 'elite').length,
        premium: allUsers.filter(u => u.subscriptionTier === 'premium').length,
        basic: allUsers.filter(u => u.subscriptionTier === 'basic' || u.subscriptionTier === 'web').length,
        free: allUsers.filter(u => u.subscriptionTier === 'free' || !u.subscriptionTier).length,
      };
      
      // Calculate MRR
      const mrr = 
        (userCounts.elite * 49.99) + 
        (userCounts.premium * 19.99) + 
        (userCounts.basic * 9.99);
      
      // Count bot connections
      const discordConnected = allUsers.filter(u => u.discordUserId).length;
      const telegramConnected = allUsers.filter(u => u.telegramChatId).length;
      
      res.json({
        users: userCounts,
        revenue: {
          mrr: Math.round(mrr * 100) / 100,
          today: 0,
        },
        bots: {
          discordConnected,
          telegramConnected,
        },
        api: {
          oddsRequests: 24,
          lastRefresh: cachedOdds.lastUpdated.toISOString(),
        },
      });
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // GAMIFICATION ROUTES
  // ═══════════════════════════════════════════════════════════════
  
  // Get user stats (levels, XP, streaks)
  app.get("/api/user/stats", (req: Request, res: Response) => {
    // Demo data - in production, fetch from database based on authenticated user
    res.json({
      level: 12,
      xp: 2340,
      xpToNextLevel: 3000,
      streak: {
        current: 7,
        longest: 23,
        rewardAt: 10, // Next reward at 10 days
      },
      stats: {
        totalHits: 127,
        totalMisses: 38,
        hitRate: 77,
        totalHypotheticalGain: 2847,
      },
      badges: [
        { id: 'first_hit', name: 'First Hit', icon: '1', earned: true, earnedAt: '2024-01-05' },
        { id: 'week_streak', name: '7 Day Streak', icon: '2', earned: true, earnedAt: '2024-01-12' },
        { id: 'high_roller', name: 'High Roller', icon: '3', earned: false, progress: 75 },
        { id: 'parlay_master', name: 'Parlay Master', icon: '4', earned: false, progress: 40 },
        { id: 'sharp_eye', name: 'Sharp Eye', icon: '5', earned: true, earnedAt: '2024-01-18' },
      ],
      achievements: [
        { name: '10 Hits in a Row', progress: 7, total: 10, reward: '500 XP' },
        { name: 'Follow 5 Users', progress: 2, total: 5, reward: 'Social Badge' },
        { name: 'Hit a 5-Leg Parlay', progress: 0, total: 1, reward: 'Parlay Master Badge' },
      ],
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LEADERBOARD ROUTES
  // ═══════════════════════════════════════════════════════════════
  
  app.get("/api/leaderboard", (req: Request, res: Response) => {
    const timeframe = req.query.timeframe as string || 'weekly';
    
    // Demo leaderboard data (updated language for legal compliance)
    const leaderboards = {
      weekly: [
        { rank: 1, username: 'SharpBettor', hitRate: 89, hypotheticalGain: 4200, level: 28, streak: 12 },
        { rank: 2, username: 'ValueHunter', hitRate: 85, hypotheticalGain: 3100, level: 24, streak: 8 },
        { rank: 3, username: 'BetMaster', hitRate: 82, hypotheticalGain: 2800, level: 21, streak: 5 },
        { rank: 4, username: 'OddsKing', hitRate: 80, hypotheticalGain: 2400, level: 19, streak: 3 },
        { rank: 5, username: 'EVHero', hitRate: 78, hypotheticalGain: 2100, level: 17, streak: 6 },
        { rank: 6, username: 'ParlayPro', hitRate: 76, hypotheticalGain: 1800, level: 15, streak: 4 },
        { rank: 7, username: 'LineWatcher', hitRate: 74, hypotheticalGain: 1500, level: 14, streak: 2 },
        { rank: 8, username: 'MoneyMaker', hitRate: 72, hypotheticalGain: 1200, level: 12, streak: 1 },
        { rank: 9, username: 'BetWise', hitRate: 70, hypotheticalGain: 900, level: 10, streak: 0 },
        { rank: 10, username: 'WinChaser', hitRate: 68, hypotheticalGain: 600, level: 8, streak: 1 },
      ],
      monthly: [
        { rank: 1, username: 'ProPicks', hitRate: 91, hypotheticalGain: 12500, level: 35, streak: 18 },
        { rank: 2, username: 'SharpBettor', hitRate: 88, hypotheticalGain: 10200, level: 28, streak: 12 },
        { rank: 3, username: 'ValueHunter', hitRate: 86, hypotheticalGain: 8800, level: 24, streak: 8 },
      ],
      allTime: [
        { rank: 1, username: 'Legend', hitRate: 88, hypotheticalGain: 45000, level: 50, streak: 0 },
        { rank: 2, username: 'ProPicks', hitRate: 87, hypotheticalGain: 38000, level: 45, streak: 18 },
        { rank: 3, username: 'SharpBettor', hitRate: 85, hypotheticalGain: 32000, level: 28, streak: 12 },
      ],
    };
    
    res.json({
      disclaimer: 'Rankings reflect simulated tracking only. No real money wagers placed.',
      timeframe,
      leaderboard: leaderboards[timeframe as keyof typeof leaderboards] || leaderboards.weekly,
      userRank: { rank: 156, username: 'You', hitRate: 65, hypotheticalGain: 450, level: 12 },
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SOCIAL FEED ROUTES
  // ═══════════════════════════════════════════════════════════════
  
  app.get("/api/social/feed", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Demo social feed data (updated language for legal compliance)
    const feed = [
      {
        id: '1',
        username: 'SharpBettor',
        level: 28,
        action: 'parlay_hit',
        content: 'Just tracked a 4-leg parlay hit!',
        metadata: {
          legs: 4,
          odds: '+850',
          hypotheticalGain: 850,
        },
        likes: 89,
        comments: 15,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: '2',
        username: 'ValueHunter',
        level: 24,
        action: 'model_hit',
        content: 'Lakers -3.5 model pick hit!',
        metadata: {
          game: 'Lakers vs Warriors',
          selection: 'Lakers -3.5',
          ev: 12.5,
          hypotheticalGain: 200,
        },
        likes: 45,
        comments: 8,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '3',
        username: 'BetMaster',
        level: 21,
        action: 'streak_milestone',
        content: 'Just reached a 10-day streak!',
        metadata: {
          streak: 10,
          badge: '10 Day Streak',
        },
        likes: 67,
        comments: 12,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: '4',
        username: 'ParlayPro',
        level: 15,
        action: 'pick_shared',
        content: 'Loving this Chiefs pick tonight',
        metadata: {
          game: 'Chiefs vs Bills',
          selection: 'Chiefs ML',
          odds: '+150',
          ev: 8.3,
        },
        likes: 23,
        comments: 5,
        timestamp: new Date(Date.now() - 10800000).toISOString(),
      },
    ];
    
    res.json({
      feed: feed.slice(0, limit),
      total: feed.length,
    });
  });

  // Like a post
  app.post("/api/social/like/:postId", (req: Request, res: Response) => {
    const { postId } = req.params;
    // In production: Toggle like in database
    res.json({ success: true, postId, liked: true });
  });

  // Follow a user
  app.post("/api/social/follow/:userId", (req: Request, res: Response) => {
    const { userId } = req.params;
    // In production: Create follow relationship in database
    res.json({ success: true, userId, following: true });
  });

  // ═══════════════════════════════════════════════════════════════
  // PERFORMANCE SIMULATOR ROUTES (formerly Profit Tracker)
  // ═══════════════════════════════════════════════════════════════
  
  // Support both old and new endpoint names for backwards compatibility
  app.get("/api/user/performance-simulator", (req: Request, res: Response) => {
    // Demo performance simulator data - shows hypothetical "what if" results
    res.json({
      disclaimer: 'All results are simulated. MVP does not accept bets or hold funds.',
      summary: {
        totalHypotheticalGain: 2847,
        totalPicksTracked: 165,
        hits: 127,
        misses: 38,
        hitRate: 77,
        simulatedBetAmount: 100,
      },
      bestDay: { date: '2024-01-15', hypotheticalGain: 640, picks: 8 },
      worstDay: { date: '2024-01-08', hypotheticalGain: -200, picks: 5 },
      currentMonth: {
        hypotheticalGain: 2847,
        hits: 35,
        misses: 12,
        roi: 24.5,
      },
      recentPicks: [
        { date: '2024-01-22', game: 'Lakers vs Warriors', selection: 'Lakers -3.5', result: 'hit', hypotheticalGain: 91 },
        { date: '2024-01-22', game: 'Chiefs vs Bills', selection: 'Chiefs ML', result: 'hit', hypotheticalGain: 150 },
        { date: '2024-01-21', game: 'Celtics vs Heat', selection: 'Celtics -5.5', result: 'miss', hypotheticalGain: -100 },
        { date: '2024-01-21', game: '49ers vs Eagles', selection: 'Over 45.5', result: 'hit', hypotheticalGain: 91 },
        { date: '2024-01-20', game: 'Bucks vs Knicks', selection: 'Bucks ML', result: 'hit', hypotheticalGain: 120 },
      ],
      chartData: [
        { date: '2024-01-16', hypotheticalGain: 150, cumulative: 150 },
        { date: '2024-01-17', hypotheticalGain: 230, cumulative: 380 },
        { date: '2024-01-18', hypotheticalGain: -100, cumulative: 280 },
        { date: '2024-01-19', hypotheticalGain: 180, cumulative: 460 },
        { date: '2024-01-20', hypotheticalGain: 320, cumulative: 780 },
        { date: '2024-01-21', hypotheticalGain: -50, cumulative: 730 },
        { date: '2024-01-22', hypotheticalGain: 241, cumulative: 971 },
      ],
    });
  });

  // Backwards compatibility alias
  app.get("/api/user/profit-tracker", (req: Request, res: Response) => {
    res.redirect('/api/user/performance-simulator');
  });

  // ═══════════════════════════════════════════════════════════════
  // SHARE GRAPHICS ROUTES
  // ═══════════════════════════════════════════════════════════════
  
  app.post("/api/share/generate", async (req: Request, res: Response) => {
    const { type, data } = req.body;
    
    // In production: Generate actual images using canvas or an image service
    // For now, return shareable text and mock URLs
    
    let shareText = '';
    switch (type) {
      case 'parlay_hit':
        shareText = `Tracked a ${data.legs}-leg parlay hit (${data.odds}) on MVP! Simulated $${data.stake} to $${data.payout}`;
        break;
      case 'performance_summary':
        shareText = `This month on MVP: ${data.hitRate}% model hit rate, +$${data.hypotheticalGain} simulated gain. Track your picks!`;
        break;
      case 'streak':
        shareText = `${data.days}-day tracking streak on MVP! Following the model picks.`;
        break;
      case 'pick':
        shareText = `Model pick: ${data.selection} | ${data.odds} | ${data.ev}% EV. Found on MVP.`;
        break;
      default:
        shareText = 'Check out MVP - the smartest way to track sports predictions!';
    }
    
    res.json({
      success: true,
      shareText,
      hashtags: '#MVP #SportsBetting #ValueBets #Parlay',
      urls: {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
        copy: shareText,
      },
      disclaimer: 'For entertainment purposes only. Gamble responsibly.',
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DISCORD & TELEGRAM BOT ROUTES
  // ═══════════════════════════════════════════════════════════════
  app.use("/api/discord", discordRoutes);
  app.use("/api/telegram", telegramRoutes);

  // Initialize odds cache on startup
  refreshOddsCache();
  
  // Set up periodic refresh (every 5 minutes)
  setInterval(refreshOddsCache, CACHE_DURATION_MS);
  
  console.log("📊 MVP API routes registered");
  console.log("🔄 Odds cache will refresh every 5 minutes");
  console.log("🤖 Discord & Telegram bot routes registered");

  const httpServer = createServer(app);
  return httpServer;
}
