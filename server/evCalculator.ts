// EV (Expected Value) Calculation Engine for MVP Sports Betting
// Calculates profitable line discrepancies across sportsbooks

export interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsMarket {
  key: string;
  outcomes: OddsOutcome[];
}

export interface Bookmaker {
  title: string;
  markets: OddsMarket[];
}

export interface OddsAPIGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface EVPick {
  id: string;
  game: string;
  sport: string;
  sportKey: string;
  market: string;
  selection: string;
  point: number | null;
  bestBook: string;
  bestOdds: number;
  worstBook: string;
  worstOdds: number;
  evPercent: number;
  confidence: number;
  commenceTime: string;
  reasoning: string;
}

export interface ParlayLeg {
  id: string;
  player: string;
  stat: string;
  selection: string;
  odds: number;
  book: string;
}

export interface ParlayResult {
  legs: number;
  combinedOdds: number;
  betAmount: number;
  potentialPayout: number;
  potentialProfit: number;
}

/**
 * Convert American odds to implied probability
 */
export function americanToProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Convert American odds to decimal odds
 */
export function americanToDecimal(odds: number): number {
  if (odds > 0) {
    return (odds / 100) + 1;
  } else {
    return (100 / Math.abs(odds)) + 1;
  }
}

/**
 * Convert decimal odds to American odds
 */
export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2.0) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

/**
 * Calculate confidence score based on EV percentage
 */
export function calculateConfidence(evPercent: number): number {
  if (evPercent >= 15) return 95;
  if (evPercent >= 10) return 85;
  if (evPercent >= 7) return 75;
  if (evPercent >= 5) return 65;
  if (evPercent >= 3) return 55;
  return 50;
}

/**
 * Generate reasoning for a pick based on EV data
 */
export function generateReasoning(
  selection: string,
  point: number | null,
  bestBook: string,
  worstBook: string,
  evPercent: number,
  market: string
): string {
  const pointText = point !== null ? ` ${point}` : '';
  const marketText = market === 'h2h' ? 'moneyline' : market === 'spreads' ? 'spread' : 'total';
  
  if (evPercent >= 15) {
    return `Strong value play. ${bestBook} offers${pointText} at significantly better odds than ${worstBook}. ${evPercent.toFixed(1)}% edge on ${marketText}.`;
  } else if (evPercent >= 10) {
    return `Good value opportunity. Line discrepancy of +${evPercent.toFixed(1)}% between ${bestBook} and ${worstBook}. Consider ${selection}${pointText}.`;
  } else if (evPercent >= 5) {
    return `Moderate value. ${bestBook} line is more favorable for ${selection}${pointText}. ${evPercent.toFixed(1)}% EV edge.`;
  }
  return `Minor value detected. ${selection}${pointText} at ${bestBook} offers slight edge over market.`;
}

/**
 * Main EV calculation engine - finds profitable discrepancies across sportsbooks
 */
export function calculateEV(oddsData: OddsAPIGame[]): EVPick[] {
  const evPicks: EVPick[] = [];
  
  for (const game of oddsData) {
    // Group odds by market and outcome
    const bookmakerOdds: Record<string, Record<string, Array<{book: string; price: number; point?: number}>>> = {};
    
    for (const bookmaker of game.bookmakers || []) {
      const bookName = bookmaker.title;
      
      for (const market of bookmaker.markets || []) {
        if (!bookmakerOdds[market.key]) {
          bookmakerOdds[market.key] = {};
        }
        
        for (const outcome of market.outcomes) {
          const key = `${outcome.name}_${outcome.point ?? 'NA'}`;
          
          if (!bookmakerOdds[market.key][key]) {
            bookmakerOdds[market.key][key] = [];
          }
          
          bookmakerOdds[market.key][key].push({
            book: bookName,
            price: outcome.price,
            point: outcome.point,
          });
        }
      }
    }
    
    // Find EV opportunities
    for (const [marketKey, outcomes] of Object.entries(bookmakerOdds)) {
      for (const [outcomeKey, books] of Object.entries(outcomes)) {
        if (books.length < 2) continue;
        
        // Find best and worst odds
        const best = books.reduce((a, b) => a.price > b.price ? a : b);
        const worst = books.reduce((a, b) => a.price < b.price ? a : b);
        
        // Calculate EV
        const bestProb = americanToProbability(best.price);
        const worstProb = americanToProbability(worst.price);
        const evPercent = ((worstProb - bestProb) / bestProb) * 100;
        
        // Only include picks with > 3% EV
        if (evPercent > 3) {
          const parts = outcomeKey.split('_');
          const selection = parts[0];
          const point = parts[1] !== 'NA' ? parseFloat(parts[1]) : null;
          
          evPicks.push({
            id: `${game.id}_${marketKey}_${outcomeKey}`,
            game: `${game.home_team} vs ${game.away_team}`,
            sport: game.sport_title || game.sport_key,
            sportKey: game.sport_key,
            market: marketKey,
            selection,
            point,
            bestBook: best.book,
            bestOdds: best.price,
            worstBook: worst.book,
            worstOdds: worst.price,
            evPercent: Math.round(evPercent * 100) / 100,
            confidence: calculateConfidence(evPercent),
            commenceTime: game.commence_time,
            reasoning: generateReasoning(selection, point, best.book, worst.book, evPercent, marketKey),
          });
        }
      }
    }
  }
  
  // Sort by EV percentage (highest first)
  return evPicks.sort((a, b) => b.evPercent - a.evPercent);
}

/**
 * Calculate parlay odds and payout
 */
export function calculateParlay(picks: ParlayLeg[], betAmount: number = 100): ParlayResult {
  if (picks.length === 0) {
    return {
      legs: 0,
      combinedOdds: 0,
      betAmount,
      potentialPayout: 0,
      potentialProfit: 0,
    };
  }
  
  // Convert all odds to decimal and multiply
  let combinedDecimal = 1.0;
  for (const pick of picks) {
    combinedDecimal *= americanToDecimal(pick.odds);
  }
  
  // Convert back to American
  const combinedAmerican = decimalToAmerican(combinedDecimal);
  
  // Calculate payout
  const payout = betAmount * combinedDecimal;
  const profit = payout - betAmount;
  
  return {
    legs: picks.length,
    combinedOdds: combinedAmerican,
    betAmount,
    potentialPayout: Math.round(payout * 100) / 100,
    potentialProfit: Math.round(profit * 100) / 100,
  };
}

/**
 * Filter picks by sport
 */
export function filterPicksBySport(picks: EVPick[], sport: string): EVPick[] {
  if (sport === 'all') return picks;
  return picks.filter(pick => pick.sportKey.toLowerCase().includes(sport.toLowerCase()));
}

/**
 * Get top N picks
 */
export function getTopPicks(picks: EVPick[], limit: number = 10): EVPick[] {
  return picks.slice(0, limit);
}

/**
 * Filter picks by minimum EV threshold
 */
export function filterByMinEV(picks: EVPick[], minEV: number): EVPick[] {
  return picks.filter(pick => pick.evPercent >= minEV);
}
