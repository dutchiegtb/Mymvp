// The Odds API Service
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
        try {
          const errorData = await response.json() as { error_code?: string; message?: string };
          if (errorData.error_code === 'OUT_OF_USAGE_CREDITS') {
            console.warn("⚠️ Odds API usage quota exceeded. Upgrade at https://the-odds-api.com/");
          } else {
            console.warn("⚠️ ODDS_API_KEY is invalid. Get a key at https://the-odds-api.com/");
          }
        } catch {
          console.warn("⚠️ ODDS_API_KEY is invalid. Get a key at https://the-odds-api.com/");
        }
        console.warn("⚠️ Falling back to mock data.");
      }
      throw new Error(`Odds API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as OddsAPIGame[];
    
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
 * Get available sports
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
  const later = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  
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
              { key: "h2h", outcomes: [
                { name: "Los Angeles Lakers", price: -120 },
                { name: "Golden State Warriors", price: 105 },
              ]},
              { key: "spreads", outcomes: [
                { name: "Los Angeles Lakers", price: -110, point: -2.5 },
                { name: "Golden State Warriors", price: -110, point: 2.5 },
              ]},
              { key: "totals", outcomes: [
                { name: "Over", price: -110, point: 228.5 },
                { name: "Under", price: -110, point: 228.5 },
              ]},
            ],
          },
          {
            title: "DraftKings",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Los Angeles Lakers", price: -115 },
                { name: "Golden State Warriors", price: 100 },
              ]},
              { key: "spreads", outcomes: [
                { name: "Los Angeles Lakers", price: -105, point: -3.0 },
                { name: "Golden State Warriors", price: -115, point: 3.0 },
              ]},
              { key: "totals", outcomes: [
                { name: "Over", price: -105, point: 229.0 },
                { name: "Under", price: -115, point: 229.0 },
              ]},
            ],
          },
          {
            title: "BetMGM",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Los Angeles Lakers", price: -125 },
                { name: "Golden State Warriors", price: 110 },
              ]},
              { key: "spreads", outcomes: [
                { name: "Los Angeles Lakers", price: -108, point: -2.0 },
                { name: "Golden State Warriors", price: -112, point: 2.0 },
              ]},
            ],
          },
          {
            title: "Caesars",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Los Angeles Lakers", price: -118 },
                { name: "Golden State Warriors", price: 102 },
              ]},
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
              { key: "h2h", outcomes: [
                { name: "Boston Celtics", price: -150 },
                { name: "Milwaukee Bucks", price: 130 },
              ]},
              { key: "spreads", outcomes: [
                { name: "Boston Celtics", price: -110, point: -4.5 },
                { name: "Milwaukee Bucks", price: -110, point: 4.5 },
              ]},
            ],
          },
          {
            title: "DraftKings",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Boston Celtics", price: -145 },
                { name: "Milwaukee Bucks", price: 125 },
              ]},
              { key: "spreads", outcomes: [
                { name: "Boston Celtics", price: -108, point: -4.0 },
                { name: "Milwaukee Bucks", price: -112, point: 4.0 },
              ]},
            ],
          },
          {
            title: "BetMGM",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Boston Celtics", price: -155 },
                { name: "Milwaukee Bucks", price: 135 },
              ]},
            ],
          },
        ],
      },
      {
        id: "nba_mock_3",
        sport_key: "basketball_nba",
        sport_title: "NBA",
        commence_time: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
        home_team: "Denver Nuggets",
        away_team: "Phoenix Suns",
        bookmakers: [
          {
            title: "FanDuel",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Denver Nuggets", price: -180 },
                { name: "Phoenix Suns", price: 155 },
              ]},
            ],
          },
          {
            title: "DraftKings",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Denver Nuggets", price: -165 },
                { name: "Phoenix Suns", price: 140 },
              ]},
            ],
          },
          {
            title: "Caesars",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Denver Nuggets", price: -175 },
                { name: "Phoenix Suns", price: 150 },
              ]},
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
              { key: "h2h", outcomes: [
                { name: "Kansas City Chiefs", price: -140 },
                { name: "Buffalo Bills", price: 120 },
              ]},
              { key: "spreads", outcomes: [
                { name: "Kansas City Chiefs", price: -110, point: -3.0 },
                { name: "Buffalo Bills", price: -110, point: 3.0 },
              ]},
            ],
          },
          {
            title: "BetMGM",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Kansas City Chiefs", price: -135 },
                { name: "Buffalo Bills", price: 115 },
              ]},
              { key: "spreads", outcomes: [
                { name: "Kansas City Chiefs", price: -105, point: -2.5 },
                { name: "Buffalo Bills", price: -115, point: 2.5 },
              ]},
            ],
          },
          {
            title: "DraftKings",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Kansas City Chiefs", price: -145 },
                { name: "Buffalo Bills", price: 125 },
              ]},
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
              { key: "h2h", outcomes: [
                { name: "Edmonton Oilers", price: -130 },
                { name: "Colorado Avalanche", price: 115 },
              ]},
            ],
          },
          {
            title: "FanDuel",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Edmonton Oilers", price: -120 },
                { name: "Colorado Avalanche", price: 105 },
              ]},
            ],
          },
          {
            title: "Caesars",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Edmonton Oilers", price: -125 },
                { name: "Colorado Avalanche", price: 108 },
              ]},
            ],
          },
        ],
      },
    ],
    baseball_mlb: [
      {
        id: "mlb_mock_1",
        sport_key: "baseball_mlb",
        sport_title: "MLB",
        commence_time: later.toISOString(),
        home_team: "New York Yankees",
        away_team: "Boston Red Sox",
        bookmakers: [
          {
            title: "FanDuel",
            markets: [
              { key: "h2h", outcomes: [
                { name: "New York Yankees", price: -155 },
                { name: "Boston Red Sox", price: 135 },
              ]},
            ],
          },
          {
            title: "DraftKings",
            markets: [
              { key: "h2h", outcomes: [
                { name: "New York Yankees", price: -145 },
                { name: "Boston Red Sox", price: 125 },
              ]},
            ],
          },
        ],
      },
    ],
    soccer_epl: [
      {
        id: "epl_mock_1",
        sport_key: "soccer_epl",
        sport_title: "Premier League",
        commence_time: later.toISOString(),
        home_team: "Arsenal",
        away_team: "Chelsea",
        bookmakers: [
          {
            title: "FanDuel",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Arsenal", price: -140 },
                { name: "Chelsea", price: 380 },
                { name: "Draw", price: 280 },
              ]},
            ],
          },
          {
            title: "DraftKings",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Arsenal", price: -130 },
                { name: "Chelsea", price: 350 },
                { name: "Draw", price: 260 },
              ]},
            ],
          },
          {
            title: "BetMGM",
            markets: [
              { key: "h2h", outcomes: [
                { name: "Arsenal", price: -145 },
                { name: "Chelsea", price: 400 },
                { name: "Draw", price: 290 },
              ]},
            ],
          },
        ],
      },
    ],
  };
  
  return mockGames[sport] || [];
}
