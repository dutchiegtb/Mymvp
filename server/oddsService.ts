// The Odds API Service for MVP
// Fetches real-time odds from 30+ sportsbooks

import { SUPPORTED_SPORTS, type SportKey } from "@shared/schema";
import type { OddsAPIGame } from "./evCalculator";

const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";

export interface OddsAPIResponse {
  data: OddsAPIGame[];
  remainingRequests: number | null;
  usedRequests: number | null;
}

/**
 * Fetch live odds from The Odds API
 */
export async function fetchLiveOdds(
  sport: SportKey,
  markets: string[] = ["h2h", "spreads", "totals"]
): Promise<OddsAPIResponse> {
  const apiKey = process.env.ODDS_API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️ ODDS_API_KEY not set, returning mock data");
    return {
      data: getMockOddsData(sport),
      remainingRequests: null,
      usedRequests: null,
    };
  }
  
  const url = `${ODDS_API_BASE_URL}/sports/${sport}/odds`;
  const params = new URLSearchParams({
    apiKey,
    regions: "us",
    markets: markets.join(","),
    oddsFormat: "american",
  });
  
  try {
    const response = await fetch(`${url}?${params}`);
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn("⚠️ ODDS_API_KEY is invalid or expired. Get a new key at https://the-odds-api.com/");
        console.warn("⚠️ Falling back to mock data. Update your ODDS_API_KEY secret to get live odds.");
      }
      throw new Error(`Odds API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as OddsAPIGame[];
    
    // Track API usage from headers
    const remainingRequests = response.headers.get("x-requests-remaining");
    const usedRequests = response.headers.get("x-requests-used");
    
    console.log(`✅ Fetched ${data.length} games for ${sport}`);
    console.log(`📊 API Usage: ${usedRequests} used, ${remainingRequests} remaining`);
    
    return {
      data,
      remainingRequests: remainingRequests ? parseInt(remainingRequests) : null,
      usedRequests: usedRequests ? parseInt(usedRequests) : null,
    };
  } catch (error) {
    console.error(`❌ Error fetching odds for ${sport}:`, error);
    return {
      data: getMockOddsData(sport),
      remainingRequests: null,
      usedRequests: null,
    };
  }
}

/**
 * Fetch odds for all supported sports
 */
export async function fetchAllSportsOdds(): Promise<OddsAPIGame[]> {
  const allOdds: OddsAPIGame[] = [];
  
  for (const sport of SUPPORTED_SPORTS) {
    try {
      const result = await fetchLiveOdds(sport.key);
      allOdds.push(...result.data);
      
      // Small delay between requests to be respectful to API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to fetch ${sport.name}:`, error);
    }
  }
  
  return allOdds;
}

/**
 * Get available sports from The Odds API
 */
export async function getAvailableSports(): Promise<Array<{key: string; name: string; emoji: string}>> {
  return SUPPORTED_SPORTS.map(sport => ({
    key: sport.key,
    name: sport.name,
    emoji: sport.emoji,
  }));
}

/**
 * Mock data for development/demo when API key is not set
 */
function getMockOddsData(sport: SportKey): OddsAPIGame[] {
  const now = new Date();
  const later = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
  
  const mockGames: Record<string, OddsAPIGame[]> = {
    basketball_nba: [
      {
        id: "nba_mock_1",
        sport_key: "basketball_nba",
        sport_title: "NBA",
        commence_time: later.toISOString(),
        home_team: "Los Angeles Lakers",
        away_team: "Golden State Warriors",
        bookmakers: [
          {
            title: "FanDuel",
            markets: [
              {
                key: "player_points",
                outcomes: [
                  { name: "LeBron James", price: -115, point: 27.5 },
                ],
              },
              {
                key: "h2h",
                outcomes: [
                  { name: "Los Angeles Lakers", price: -120 },
                  { name: "Golden State Warriors", price: 105 },
                ],
              },
            ],
          },
          {
            title: "DraftKings",
            markets: [
              {
                key: "player_points",
                outcomes: [
                  { name: "LeBron James", price: -105, point: 28.0 },
                ],
              },
              {
                key: "h2h",
                outcomes: [
                  { name: "Los Angeles Lakers", price: -115 },
                  { name: "Golden State Warriors", price: 100 },
                ],
              },
            ],
          },
          {
            title: "BetMGM",
            markets: [
              {
                key: "player_points",
                outcomes: [
                  { name: "LeBron James", price: -110, point: 28.5 },
                ],
              },
            ],
          },
          {
            title: "PrizePicks",
            markets: [
              {
                key: "player_points",
                outcomes: [
                  { name: "LeBron James", price: -110, point: 29.5 },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "nba_mock_2",
        sport_key: "basketball_nba",
        sport_title: "NBA",
        commence_time: later.toISOString(),
        home_team: "Boston Celtics",
        away_team: "Milwaukee Bucks",
        bookmakers: [
          {
            title: "FanDuel",
            markets: [
              {
                key: "player_points",
                outcomes: [
                  { name: "Jayson Tatum", price: -112, point: 26.5 },
                  { name: "Giannis Antetokounmpo", price: -108, point: 30.5 },
                ],
              },
            ],
          },
          {
            title: "DraftKings",
            markets: [
              {
                key: "player_points",
                outcomes: [
                  { name: "Jayson Tatum", price: -105, point: 27.0 },
                  { name: "Giannis Antetokounmpo", price: -115, point: 31.5 },
                ],
              },
            ],
          },
        ],
      },
    ],
    americanfootball_nfl: [
      {
        id: "nfl_mock_1",
        sport_key: "americanfootball_nfl",
        sport_title: "NFL",
        commence_time: later.toISOString(),
        home_team: "Kansas City Chiefs",
        away_team: "Buffalo Bills",
        bookmakers: [
          {
            title: "FanDuel",
            markets: [
              {
                key: "player_pass_yds",
                outcomes: [
                  { name: "Patrick Mahomes", price: -115, point: 285.5 },
                ],
              },
            ],
          },
          {
            title: "BetMGM",
            markets: [
              {
                key: "player_pass_yds",
                outcomes: [
                  { name: "Patrick Mahomes", price: -105, point: 280.5 },
                ],
              },
            ],
          },
        ],
      },
    ],
    icehockey_nhl: [
      {
        id: "nhl_mock_1",
        sport_key: "icehockey_nhl",
        sport_title: "NHL",
        commence_time: later.toISOString(),
        home_team: "Edmonton Oilers",
        away_team: "Colorado Avalanche",
        bookmakers: [
          {
            title: "DraftKings",
            markets: [
              {
                key: "player_points",
                outcomes: [
                  { name: "Connor McDavid", price: -120, point: 1.5 },
                ],
              },
            ],
          },
          {
            title: "FanDuel",
            markets: [
              {
                key: "player_points",
                outcomes: [
                  { name: "Connor McDavid", price: -105, point: 1.5 },
                ],
              },
            ],
          },
        ],
      },
    ],
    baseball_mlb: [],
    soccer_epl: [],
  };
  
  return mockGames[sport] || [];
}
