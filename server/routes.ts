import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchLiveOdds, fetchAllSportsOdds, getAvailableSports } from "./oddsService";
import { calculateEV, calculateParlay, filterPicksBySport, getTopPicks, filterByMinEV, type ParlayLeg, type EVPick } from "./evCalculator";
import { SUPPORTED_SPORTS, SPORTS_BY_CATEGORY, PREDICTION_CATEGORIES, type SportKey } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

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
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      
      // Lookup user by email in database
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Verify password hash with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Generate JWT token
      if (!JWT_SECRET) {
        return res.status(500).json({ error: 'Server configuration error' });
      }
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      
      console.log(`✅ User logged in: ${email}`);
      
      res.json({
        success: true,
        user: { 
          id: user.id,
          email: user.email,
          username: user.username,
          subscriptionTier: user.subscriptionTier, 
          subscriptionStatus: user.subscriptionStatus,
          isAdmin: user.isAdmin,
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
      
      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        isAdmin: user.isAdmin,
        preferredLanguage: user.preferredLanguage,
        theme: user.theme,
      });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(401).json({ error: 'Invalid token' });
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
          
          if (userId && tier) {
            // Update user subscription
            await storage.updateUserSubscription(parseInt(userId), tier, 'active');
            
            // Update stripe customer ID if new
            if (session.customer) {
              await storage.updateUserStripeCustomerId(parseInt(userId), session.customer as string);
            }
            
            console.log(`✅ Subscription activated: User ${userId} -> ${tier}`);
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

  // Initialize odds cache on startup
  refreshOddsCache();
  
  // Set up periodic refresh (every 5 minutes)
  setInterval(refreshOddsCache, CACHE_DURATION_MS);
  
  console.log("📊 MVP API routes registered");
  console.log("🔄 Odds cache will refresh every 5 minutes");

  const httpServer = createServer(app);
  return httpServer;
}
