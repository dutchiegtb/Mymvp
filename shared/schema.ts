import { pgTable, text, varchar, serial, timestamp, boolean, decimal, integer, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  sport: varchar("sport", { length: 50 }).notNull(),
  homeTeam: varchar("home_team", { length: 100 }).notNull(),
  awayTeam: varchar("away_team", { length: 100 }).notNull(),
  commenceTime: timestamp("commence_time").notNull(),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_games_unique").on(table.sport, table.homeTeam, table.awayTeam, table.commenceTime),
  index("idx_games_sport").on(table.sport),
  index("idx_games_commence_time").on(table.commenceTime),
]);

// Odds table
export const odds = pgTable("odds", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id, { onDelete: "cascade" }),
  sportsbook: varchar("sportsbook", { length: 100 }).notNull(),
  market: varchar("market", { length: 50 }).notNull(),
  outcome: varchar("outcome", { length: 100 }).notNull(),
  price: decimal("price").notNull(),
  point: decimal("point"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_odds_game_id").on(table.gameId),
  index("idx_odds_sportsbook").on(table.sportsbook),
  index("idx_odds_timestamp").on(table.timestamp),
]);

// Top Picks table
export const topPicks = pgTable("top_picks", {
  id: serial("id").primaryKey(),
  sport: varchar("sport", { length: 50 }).notNull(),
  gameId: integer("game_id").references(() => games.id, { onDelete: "cascade" }),
  selection: varchar("selection", { length: 255 }).notNull(),
  market: varchar("market", { length: 50 }).notNull(),
  bestBook: varchar("best_book", { length: 100 }).notNull(),
  bestOdds: decimal("best_odds").notNull(),
  evPercent: decimal("ev_percent").notNull(),
  confidence: integer("confidence").notNull(),
  reasoning: text("reasoning"),
  rank: integer("rank"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("idx_top_picks_sport").on(table.sport),
  index("idx_top_picks_rank").on(table.rank),
]);

// Insert schemas
export const insertGameSchema = createInsertSchema(games).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOddsSchema = createInsertSchema(odds).omit({ id: true, timestamp: true });
export const insertTopPickSchema = createInsertSchema(topPicks).omit({ id: true, createdAt: true });

// Types
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Odds = typeof odds.$inferSelect;
export type InsertOdds = z.infer<typeof insertOddsSchema>;
export type TopPick = typeof topPicks.$inferSelect;
export type InsertTopPick = z.infer<typeof insertTopPickSchema>;

// Sports configuration
export const SUPPORTED_SPORTS = [
  { key: "basketball_nba", name: "NBA", emoji: "🏀" },
  { key: "americanfootball_nfl", name: "NFL", emoji: "🏈" },
  { key: "baseball_mlb", name: "MLB", emoji: "⚾" },
  { key: "icehockey_nhl", name: "NHL", emoji: "🏒" },
  { key: "soccer_epl", name: "Soccer", emoji: "⚽" },
] as const;

export type SportKey = typeof SUPPORTED_SPORTS[number]["key"];

export const SPORTS_BY_CATEGORY = {
  basketball: [
    { key: "basketball_nba", name: "NBA", active: true },
  ],
  football: [
    { key: "americanfootball_nfl", name: "NFL", active: true },
  ],
  baseball: [
    { key: "baseball_mlb", name: "MLB", active: true },
  ],
  hockey: [
    { key: "icehockey_nhl", name: "NHL", active: true },
  ],
  soccer: [
    { key: "soccer_epl", name: "Premier League", active: true },
  ],
} as const;
