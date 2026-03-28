import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, desc, sql } from "drizzle-orm";
import ws from "ws";
import {
  games,
  odds,
  topPicks,
  type Game,
  type InsertGame,
  type Odds,
  type InsertOdds,
  type TopPick,
  type InsertTopPick,
} from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  // Games
  getGame(id: number): Promise<Game | undefined>;
  getUpcomingGames(sport?: string): Promise<Game[]>;
  upsertGame(game: InsertGame): Promise<Game>;

  // Odds
  insertOdds(oddsData: InsertOdds): Promise<Odds>;
  getLatestOddsForGame(gameId: number): Promise<Odds[]>;

  // Top Picks
  getTopPicks(sport?: string, limit?: number): Promise<TopPick[]>;
  insertTopPick(pick: InsertTopPick): Promise<TopPick>;
  clearExpiredPicks(): Promise<void>;
}

class DatabaseStorage implements IStorage {
  // Games
  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getUpcomingGames(sport?: string): Promise<Game[]> {
    if (sport) {
      return db.select().from(games)
        .where(eq(games.sport, sport))
        .orderBy(games.commenceTime);
    }
    return db.select().from(games).orderBy(games.commenceTime);
  }

  async upsertGame(game: InsertGame): Promise<Game> {
    const [result] = await db.insert(games).values(game)
      .onConflictDoUpdate({
        target: [games.sport, games.homeTeam, games.awayTeam, games.commenceTime],
        set: { updatedAt: new Date() },
      })
      .returning();
    return result;
  }

  // Odds
  async insertOdds(oddsData: InsertOdds): Promise<Odds> {
    const [result] = await db.insert(odds).values(oddsData).returning();
    return result;
  }

  async getLatestOddsForGame(gameId: number): Promise<Odds[]> {
    return db.select().from(odds)
      .where(eq(odds.gameId, gameId))
      .orderBy(desc(odds.timestamp));
  }

  // Top Picks
  async getTopPicks(sport?: string, limit: number = 10): Promise<TopPick[]> {
    if (sport && sport !== "all") {
      return db.select().from(topPicks)
        .where(eq(topPicks.sport, sport))
        .orderBy(topPicks.rank)
        .limit(limit);
    }
    return db.select().from(topPicks)
      .orderBy(topPicks.rank)
      .limit(limit);
  }

  async insertTopPick(pick: InsertTopPick): Promise<TopPick> {
    const [result] = await db.insert(topPicks).values(pick).returning();
    return result;
  }

  async clearExpiredPicks(): Promise<void> {
    await db.delete(topPicks).where(
      sql`${topPicks.expiresAt} < NOW()`
    );
  }
}

export const storage = new DatabaseStorage();
