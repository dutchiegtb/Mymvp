import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and, gt, desc, sql } from "drizzle-orm";
import ws from "ws";
import {
  users,
  games,
  odds,
  topPicks,
  userParlays,
  botUsers,
  botAlerts,
  oddsAudit,
  type User,
  type InsertUser,
  type Game,
  type InsertGame,
  type Odds,
  type InsertOdds,
  type TopPick,
  type InsertTopPick,
  type UserParlay,
  type InsertParlay,
} from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(userId: number, tier: string, status: string): Promise<User | undefined>;
  
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
  
  // Parlays
  createParlay(parlay: InsertParlay): Promise<UserParlay>;
  getUserParlays(userId: number): Promise<UserParlay[]>;
  
  // Audit
  logOddsUpdate(gamesUpdated: number, oddsInserted: number, apiCallsUsed: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserSubscription(userId: number, tier: string, status: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // Games
  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getUpcomingGames(sport?: string): Promise<Game[]> {
    const now = new Date();
    
    if (sport && sport !== 'all') {
      return db
        .select()
        .from(games)
        .where(and(gt(games.commenceTime, now), eq(games.sport, sport)))
        .orderBy(games.commenceTime);
    }
    
    return db
      .select()
      .from(games)
      .where(gt(games.commenceTime, now))
      .orderBy(games.commenceTime);
  }

  async upsertGame(game: InsertGame): Promise<Game> {
    const [upserted] = await db
      .insert(games)
      .values(game)
      .onConflictDoUpdate({
        target: [games.sport, games.homeTeam, games.awayTeam, games.commenceTime],
        set: { updatedAt: new Date() },
      })
      .returning();
    return upserted;
  }

  // Odds
  async insertOdds(oddsData: InsertOdds): Promise<Odds> {
    const [inserted] = await db.insert(odds).values(oddsData).returning();
    return inserted;
  }

  async getLatestOddsForGame(gameId: number): Promise<Odds[]> {
    return db
      .select()
      .from(odds)
      .where(eq(odds.gameId, gameId))
      .orderBy(desc(odds.timestamp));
  }

  // Top Picks
  async getTopPicks(sport?: string, limit: number = 10): Promise<TopPick[]> {
    const now = new Date();
    
    if (sport && sport !== 'all') {
      return db
        .select()
        .from(topPicks)
        .where(and(
          eq(topPicks.sport, sport),
          gt(topPicks.expiresAt, now)
        ))
        .orderBy(topPicks.rank)
        .limit(limit);
    }
    
    return db
      .select()
      .from(topPicks)
      .where(gt(topPicks.expiresAt, now))
      .orderBy(topPicks.rank)
      .limit(limit);
  }

  async insertTopPick(pick: InsertTopPick): Promise<TopPick> {
    const [inserted] = await db.insert(topPicks).values(pick).returning();
    return inserted;
  }

  async clearExpiredPicks(): Promise<void> {
    const now = new Date();
    await db.delete(topPicks).where(gt(now, topPicks.expiresAt));
  }

  // Parlays
  async createParlay(parlay: InsertParlay): Promise<UserParlay> {
    const [created] = await db.insert(userParlays).values(parlay).returning();
    return created;
  }

  async getUserParlays(userId: number): Promise<UserParlay[]> {
    return db
      .select()
      .from(userParlays)
      .where(eq(userParlays.userId, userId))
      .orderBy(desc(userParlays.createdAt));
  }

  // Audit
  async logOddsUpdate(gamesUpdated: number, oddsInserted: number, apiCallsUsed: number): Promise<void> {
    await db.insert(oddsAudit).values({
      action: "odds_update",
      gamesUpdated,
      oddsInserted,
      apiCallsUsed,
    });
  }
}

export const storage = new DatabaseStorage();
