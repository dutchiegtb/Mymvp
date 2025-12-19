import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, boolean, decimal, integer, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  subscriptionTier: varchar("subscription_tier", { length: 50 }).default("free"),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("inactive"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_subscription_tier").on(table.subscriptionTier),
]);

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

// User Parlays table
export const userParlays = pgTable("user_parlays", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }),
  legs: jsonb("legs").notNull(),
  combinedOdds: decimal("combined_odds").notNull(),
  betAmount: decimal("bet_amount"),
  potentialPayout: decimal("potential_payout"),
  status: varchar("status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bot Users table
export const botUsers = pgTable("bot_users", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform", { length: 50 }).notNull(),
  platformUserId: varchar("platform_user_id", { length: 255 }).notNull(),
  platformUsername: varchar("platform_username", { length: 255 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_bot_users_unique").on(table.platform, table.platformUserId),
  index("idx_bot_users_platform").on(table.platform, table.platformUserId),
]);

// Bot Alerts table
export const botAlerts = pgTable("bot_alerts", {
  id: serial("id").primaryKey(),
  botUserId: integer("bot_user_id").references(() => botUsers.id, { onDelete: "cascade" }),
  alertType: varchar("alert_type", { length: 50 }).notNull(),
  minEvPercent: decimal("min_ev_percent").default("5.0"),
  sports: jsonb("sports"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Odds Audit table
export const oddsAudit = pgTable("odds_audit", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 50 }).notNull(),
  gamesUpdated: integer("games_updated"),
  oddsInserted: integer("odds_inserted"),
  apiCallsUsed: integer("api_calls_used"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGameSchema = createInsertSchema(games).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOddsSchema = createInsertSchema(odds).omit({ id: true, timestamp: true });
export const insertTopPickSchema = createInsertSchema(topPicks).omit({ id: true, createdAt: true });
export const insertParlaySchema = createInsertSchema(userParlays).omit({ id: true, createdAt: true });
export const insertBotUserSchema = createInsertSchema(botUsers).omit({ id: true, createdAt: true });
export const insertBotAlertSchema = createInsertSchema(botAlerts).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Odds = typeof odds.$inferSelect;
export type InsertOdds = z.infer<typeof insertOddsSchema>;
export type TopPick = typeof topPicks.$inferSelect;
export type InsertTopPick = z.infer<typeof insertTopPickSchema>;
export type UserParlay = typeof userParlays.$inferSelect;
export type InsertParlay = z.infer<typeof insertParlaySchema>;
export type BotUser = typeof botUsers.$inferSelect;
export type InsertBotUser = z.infer<typeof insertBotUserSchema>;
export type BotAlert = typeof botAlerts.$inferSelect;
export type InsertBotAlert = z.infer<typeof insertBotAlertSchema>;

// Subscription tiers
export type SubscriptionTier = "free" | "pro" | "premium" | "elite";

// Sports configuration
export const SUPPORTED_SPORTS = [
  { key: "basketball_nba", name: "NBA", emoji: "🏀" },
  { key: "americanfootball_nfl", name: "NFL", emoji: "🏈" },
  { key: "baseball_mlb", name: "MLB", emoji: "⚾" },
  { key: "icehockey_nhl", name: "NHL", emoji: "🏒" },
  { key: "soccer_epl", name: "Soccer", emoji: "⚽" },
] as const;

export type SportKey = typeof SUPPORTED_SPORTS[number]["key"];
