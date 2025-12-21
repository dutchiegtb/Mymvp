import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, boolean, decimal, integer, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  subscriptionTier: varchar("subscription_tier", { length: 50 }).default("free"),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("inactive"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
  theme: varchar("theme", { length: 20 }).default("dark"),
  referredByCode: varchar("referred_by_code", { length: 50 }),
  isAdmin: boolean("is_admin").default(false),
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

// Promo Codes table
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' | 'fixed' | 'trial_days'
  discountValue: decimal("discount_value").notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_promo_codes_code").on(table.code),
]);

// Promo Code Redemptions table
export const promoRedemptions = pgTable("promo_redemptions", {
  id: serial("id").primaryKey(),
  promoCodeId: integer("promo_code_id").references(() => promoCodes.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
});

// Ambassadors table
export const ambassadors = pgTable("ambassadors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  referralCode: varchar("referral_code", { length: 50 }).notNull().unique(),
  commissionPercent: decimal("commission_percent").default("10"),
  totalReferrals: integer("total_referrals").default(0),
  totalEarnings: decimal("total_earnings").default("0"),
  payoutThreshold: decimal("payout_threshold").default("50"),
  pendingPayout: decimal("pending_payout").default("0"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_ambassadors_referral_code").on(table.referralCode),
]);

// Ambassador Referrals table
export const ambassadorReferrals = pgTable("ambassador_referrals", {
  id: serial("id").primaryKey(),
  ambassadorId: integer("ambassador_id").references(() => ambassadors.id, { onDelete: "cascade" }),
  referredUserId: integer("referred_user_id").references(() => users.id, { onDelete: "cascade" }),
  subscriptionAmount: decimal("subscription_amount"),
  commissionEarned: decimal("commission_earned"),
  status: varchar("status", { length: 20 }).default("pending"), // 'pending' | 'paid' | 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGameSchema = createInsertSchema(games).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOddsSchema = createInsertSchema(odds).omit({ id: true, timestamp: true });
export const insertTopPickSchema = createInsertSchema(topPicks).omit({ id: true, createdAt: true });
export const insertParlaySchema = createInsertSchema(userParlays).omit({ id: true, createdAt: true });
export const insertBotUserSchema = createInsertSchema(botUsers).omit({ id: true, createdAt: true });
export const insertBotAlertSchema = createInsertSchema(botAlerts).omit({ id: true, createdAt: true });
export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({ id: true, createdAt: true, currentUses: true });
export const insertAmbassadorSchema = createInsertSchema(ambassadors).omit({ id: true, createdAt: true, totalReferrals: true, totalEarnings: true, pendingPayout: true });

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
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type Ambassador = typeof ambassadors.$inferSelect;
export type InsertAmbassador = z.infer<typeof insertAmbassadorSchema>;

// Subscription tiers
export type SubscriptionTier = "free" | "web" | "premium" | "elite";

// Sports configuration - 40+ sports
export const SPORTS_BY_CATEGORY = {
  basketball: [
    { key: "basketball_nba", name: "NBA", active: true },
    { key: "basketball_ncaab", name: "NCAA Basketball", active: true },
    { key: "basketball_euroleague", name: "EuroLeague", active: true },
    { key: "basketball_wnba", name: "WNBA", active: true },
  ],
  football: [
    { key: "americanfootball_nfl", name: "NFL", active: true },
    { key: "americanfootball_ncaaf", name: "NCAA Football", active: true },
    { key: "americanfootball_cfl", name: "CFL", active: true },
    { key: "americanfootball_xfl", name: "XFL", active: true },
  ],
  baseball: [
    { key: "baseball_mlb", name: "MLB", active: true },
    { key: "baseball_ncaa", name: "NCAA Baseball", active: true },
    { key: "baseball_npb", name: "NPB (Japan)", active: true },
    { key: "baseball_kbo", name: "KBO (Korea)", active: true },
  ],
  hockey: [
    { key: "icehockey_nhl", name: "NHL", active: true },
    { key: "icehockey_ahl", name: "AHL", active: true },
    { key: "icehockey_khl", name: "KHL", active: true },
    { key: "icehockey_shl", name: "SHL", active: true },
  ],
  soccer: [
    { key: "soccer_epl", name: "Premier League", active: true },
    { key: "soccer_spain_la_liga", name: "La Liga", active: true },
    { key: "soccer_italy_serie_a", name: "Serie A", active: true },
    { key: "soccer_germany_bundesliga", name: "Bundesliga", active: true },
    { key: "soccer_france_ligue_one", name: "Ligue 1", active: true },
    { key: "soccer_uefa_champs_league", name: "Champions League", active: true },
    { key: "soccer_mls", name: "MLS", active: true },
    { key: "soccer_brazil_serie_a", name: "Brazil Serie A", active: true },
  ],
  combat: [
    { key: "mma_mixed_martial_arts", name: "UFC/MMA", active: true },
    { key: "boxing_boxing", name: "Boxing", active: true },
  ],
  tennis: [
    { key: "tennis_atp_us_open", name: "US Open", active: true },
    { key: "tennis_atp_wimbledon", name: "Wimbledon", active: true },
    { key: "tennis_atp_french_open", name: "French Open", active: true },
    { key: "tennis_atp_aus_open", name: "Australian Open", active: true },
  ],
  golf: [
    { key: "golf_pga", name: "PGA Tour", active: true },
    { key: "golf_masters", name: "Masters", active: true },
  ],
  esports: [
    { key: "esports_lol", name: "League of Legends", active: true },
    { key: "esports_csgo", name: "CS:GO / CS2", active: true },
    { key: "esports_dota2", name: "Dota 2", active: true },
    { key: "esports_valorant", name: "Valorant", active: true },
    { key: "esports_cod", name: "Call of Duty", active: true },
  ],
  other: [
    { key: "cricket_ipl", name: "IPL Cricket", active: true },
    { key: "rugby_league", name: "Rugby League", active: true },
    { key: "aussie_rules", name: "AFL", active: true },
    { key: "table_tennis", name: "Table Tennis", active: true },
  ],
} as const;

// Legacy supported sports (for backwards compatibility)
export const SUPPORTED_SPORTS = [
  { key: "basketball_nba", name: "NBA", emoji: "🏀" },
  { key: "americanfootball_nfl", name: "NFL", emoji: "🏈" },
  { key: "baseball_mlb", name: "MLB", emoji: "⚾" },
  { key: "icehockey_nhl", name: "NHL", emoji: "🏒" },
  { key: "soccer_epl", name: "Soccer", emoji: "⚽" },
] as const;

export type SportKey = typeof SUPPORTED_SPORTS[number]["key"];

// Prediction market categories (Polymarket integration)
export const PREDICTION_CATEGORIES = [
  { key: "politics", name: "Politics & Elections" },
  { key: "economics", name: "Economics & Finance" },
  { key: "entertainment", name: "Entertainment & Culture" },
  { key: "science", name: "Science & Technology" },
  { key: "sports_events", name: "Sports Events" },
] as const;
