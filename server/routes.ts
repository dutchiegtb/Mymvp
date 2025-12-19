import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchLiveOdds, fetchAllSportsOdds, getAvailableSports } from "./oddsService";
import { calculateEV, calculateParlay, filterPicksBySport, getTopPicks, filterByMinEV, type ParlayLeg, type EVPick } from "./evCalculator";
import { SUPPORTED_SPORTS, type SportKey } from "@shared/schema";

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

  // Initialize odds cache on startup
  refreshOddsCache();
  
  // Set up periodic refresh (every 5 minutes)
  setInterval(refreshOddsCache, CACHE_DURATION_MS);
  
  console.log("📊 MVP API routes registered");
  console.log("🔄 Odds cache will refresh every 5 minutes");

  const httpServer = createServer(app);
  return httpServer;
}
