import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchLiveOdds, getAvailableSports } from "./oddsService";
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
    const allOdds: any[] = [];

    for (const sport of SUPPORTED_SPORTS) {
      try {
        const result = await fetchLiveOdds(sport.key);
        allOdds.push(...result.data);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to fetch ${sport.name}:`, error);
      }
    }

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

async function getOddsWithCache(): Promise<EVPick[]> {
  const now = new Date();
  if (now.getTime() - cachedOdds.lastUpdated.getTime() > CACHE_DURATION_MS) {
    await refreshOddsCache();
  }
  return cachedOdds.data;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // Get supported sports
  app.get("/api/sports", async (_req, res) => {
    try {
      const sports = await getAvailableSports();
      res.json({ sports });
    } catch (error) {
      res.status(500).json({ error: "Failed to get sports" });
    }
  });

  // Get live odds for a sport
  app.get("/api/odds/live", async (req, res) => {
    try {
      const sport = (req.query.sport as string) || "basketball_nba";
      const result = await fetchLiveOdds(sport as SportKey);
      res.json({
        games: result.data,
        count: result.data.length,
        apiUsage: {
          remaining: result.remainingRequests,
          used: result.usedRequests,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch live odds" });
    }
  });

  // Get EV picks (core feature)
  app.get("/api/picks/ev", async (req, res) => {
    try {
      const sport = (req.query.sport as string) || "all";
      const minEV = parseFloat(req.query.minEV as string) || 3;

      let picks = await getOddsWithCache();

      // Filter by sport
      if (sport !== "all") {
        picks = filterPicksBySport(picks, sport);
      }

      // Filter by minimum EV
      picks = filterByMinEV(picks, minEV);

      res.json({
        picks,
        total: picks.length,
        lastUpdated: cachedOdds.lastUpdated.toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get EV picks" });
    }
  });

  // Get top picks
  app.get("/api/picks/top", async (req, res) => {
    try {
      const sport = (req.query.sport as string) || "all";
      const limit = parseInt(req.query.limit as string) || 10;

      let picks = await getOddsWithCache();

      if (sport !== "all") {
        picks = filterPicksBySport(picks, sport);
      }

      const topPicksList = getTopPicks(picks, limit).map((pick, i) => ({
        ...pick,
        rank: i + 1,
      }));

      res.json({
        picks: topPicksList,
        sport,
        lastUpdated: cachedOdds.lastUpdated.toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get top picks" });
    }
  });

  // Calculate parlay
  app.post("/api/parlay", (req, res) => {
    try {
      const { picks, betAmount = 100 } = req.body as {
        picks: ParlayLeg[];
        betAmount?: number;
      };

      if (!picks || !Array.isArray(picks) || picks.length === 0) {
        return res.status(400).json({ error: "At least one pick is required" });
      }

      const result = calculateParlay(picks, betAmount);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate parlay" });
    }
  });

  const httpServer = createServer(app);

  // Refresh odds cache on startup
  refreshOddsCache();

  // Auto-refresh every 5 minutes
  setInterval(refreshOddsCache, CACHE_DURATION_MS);

  return httpServer;
}
