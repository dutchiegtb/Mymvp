import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchLiveOdds, fetchAllSportsOdds, getAvailableSports } from "./oddsService";
import { calculateEV, calculateParlay, filterPicksBySport, getTopPicks, filterByMinEV, type ParlayLeg, type EVPick } from "./evCalculator";
import { SUPPORTED_SPORTS, SPORTS_BY_CATEGORY, PREDICTION_CATEGORIES, type SportKey } from "@shared/schema";

// Admin key from environment (secure - no fallback)
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

// Middleware to require admin access
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!ADMIN_SECRET_KEY) {
    return res.status(503).json({ error: 'Admin access not configured. Set ADMIN_SECRET_KEY environment variable.' });
  }
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== ADMIN_SECRET_KEY) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

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
  app.post("/api/admin/refresh-odds", async (req: Request, res: Response) => {
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
  // AUTH ROUTES
  // ═══════════════════════════════════════════════════════════════
  
  // AUTH ROUTES - Development mode (requires bcrypt + JWT for production)
  // These are placeholder routes that allow testing the flow
  // Production requires: password hashing, database storage, JWT tokens
  
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, username, referralCode } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      
      // DEVELOPMENT MODE: In production, implement:
      // 1. Hash password with bcrypt
      // 2. Check if email already exists in database
      // 3. Create user record in database
      // 4. Generate JWT token with expiration
      
      console.log(`[DEV] Register attempt: ${email}`);
      
      res.json({
        success: true,
        message: 'Account created (dev mode)',
        user: { email, username, subscriptionTier: 'free' },
        token: 'dev-token-' + Date.now(),
        _devWarning: 'This is development mode. Auth not persisted.'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      
      // DEVELOPMENT MODE: In production, implement:
      // 1. Lookup user by email in database
      // 2. Verify password hash with bcrypt.compare()
      // 3. Generate JWT token with user ID
      
      console.log(`[DEV] Login attempt: ${email}`);
      
      res.json({
        success: true,
        user: { email, subscriptionTier: 'free', subscriptionStatus: 'inactive' },
        token: 'dev-token-' + Date.now(),
        _devWarning: 'This is development mode. Auth not verified.'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    // DEVELOPMENT MODE: In production:
    // 1. Extract JWT from Authorization header
    // 2. Verify token signature and expiration
    // 3. Return user data from database
    
    res.json({
      email: 'demo@example.com',
      username: 'demo_user',
      subscriptionTier: 'free',
      subscriptionStatus: 'inactive',
      preferredLanguage: 'en',
      theme: 'dark',
      _devWarning: 'This is development mode. Returns mock user data.'
    });
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
      
      // TODO: Create ambassador in database
      
      res.json({
        success: true,
        ambassador: {
          email,
          referralCode: referralCode.toUpperCase(),
          commissionPercent: commissionPercent || 10,
          active: true,
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create ambassador' });
    }
  });

  // Admin: Get system stats
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

  // Initialize odds cache on startup
  refreshOddsCache();
  
  // Set up periodic refresh (every 5 minutes)
  setInterval(refreshOddsCache, CACHE_DURATION_MS);
  
  console.log("📊 MVP API routes registered");
  console.log("🔄 Odds cache will refresh every 5 minutes");

  const httpServer = createServer(app);
  return httpServer;
}
