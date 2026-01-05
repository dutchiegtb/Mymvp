import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and, gt, gte, desc, sql, isNotNull } from "drizzle-orm";
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
  ambassadors,
  ambassadorPayouts,
  ambassadorReferrals,
  badges,
  userBadges,
  passwordResetTokens,
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
  type Ambassador,
  type InsertAmbassador,
  type AmbassadorPayout,
  type InsertAmbassadorPayout,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type PasswordResetToken,
  type InsertPasswordResetToken,
} from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  getUserByDiscordId(discordUserId: string): Promise<User | undefined>;
  getUserByTelegramChatId(telegramChatId: string): Promise<User | undefined>;
  getUsersWithDiscord(): Promise<User[]>;
  getUsersWithTelegram(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserSubscription(userId: number, tier: string, status: string): Promise<User | undefined>;
  updateUserStripeCustomerId(userId: number, customerId: string): Promise<User | undefined>;
  
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
  
  // Ambassadors
  getAmbassadorByCode(code: string): Promise<Ambassador | undefined>;
  getAmbassadorByUserId(userId: number): Promise<Ambassador | undefined>;
  createAmbassador(data: InsertAmbassador): Promise<Ambassador>;
  updateAmbassadorEarnings(ambassadorId: number, amount: number): Promise<void>;
  getAllAmbassadors(): Promise<Ambassador[]>;
  getAmbassadorPayouts(ambassadorId?: number): Promise<AmbassadorPayout[]>;
  createAmbassadorPayout(data: InsertAmbassadorPayout): Promise<AmbassadorPayout>;
  markAmbassadorPayoutCompleted(payoutId: number, reference: string): Promise<void>;
  createAmbassadorReferral(ambassadorId: number, referredUserId: number, subscriptionAmount: number, commissionEarned: number, subscriptionTier?: string): Promise<void>;
  
  // Badges
  getBadgeByKey(key: string): Promise<Badge | undefined>;
  createBadge(data: InsertBadge): Promise<Badge>;
  getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge })[]>;
  assignBadge(userId: number, badgeKey: string): Promise<UserBadge | undefined>;
  hasBadge(userId: number, badgeKey: string): Promise<boolean>;
  
  // Referral Stats
  getAmbassadorReferrals(ambassadorId: number): Promise<any[]>;
  getAmbassadorStats(): Promise<{ ambassadorId: number; referralCount: number; totalCommission: number }[]>;
  checkAndAwardBonusMilestones(ambassadorId: number): Promise<{ bonusType: string; amount: number } | null>;
  updateAmbassadorTier(ambassadorId: number): Promise<string>;
  
  // Password Reset
  createPasswordResetToken(data: { userId: number; token: string; expiresAt: Date }): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(tokenId: number): Promise<void>;
  getPendingPasswordResets(): Promise<{ id: number; email: string; token: string; expiresAt: Date; createdAt: Date }[]>;
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
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

  async updateUserStripeCustomerId(userId: number, customerId: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getUserByDiscordId(discordUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordUserId, discordUserId));
    return user;
  }

  async getUserByTelegramChatId(telegramChatId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramChatId, telegramChatId));
    return user;
  }

  async getUsersWithDiscord(): Promise<User[]> {
    return db.select().from(users).where(isNotNull(users.discordUserId));
  }

  async getUsersWithTelegram(): Promise<User[]> {
    return db.select().from(users).where(isNotNull(users.telegramChatId));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({
        ...updates,
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
    await db.delete(topPicks).where(sql`${topPicks.expiresAt} < ${now}`);
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

  // Ambassadors
  async getAmbassadorByCode(code: string): Promise<Ambassador | undefined> {
    const [ambassador] = await db.select().from(ambassadors).where(eq(ambassadors.referralCode, code.toUpperCase()));
    return ambassador;
  }

  async getAmbassadorByUserId(userId: number): Promise<Ambassador | undefined> {
    const [ambassador] = await db.select().from(ambassadors).where(eq(ambassadors.userId, userId));
    return ambassador;
  }

  async createAmbassador(data: InsertAmbassador): Promise<Ambassador> {
    const [ambassador] = await db.insert(ambassadors).values({
      ...data,
      referralCode: data.referralCode.toUpperCase(),
    }).returning();
    return ambassador;
  }

  async updateAmbassadorEarnings(ambassadorId: number, amount: number): Promise<void> {
    await db
      .update(ambassadors)
      .set({
        pendingPayout: sql`COALESCE(${ambassadors.pendingPayout}, 0) + ${amount.toString()}`,
        totalEarnings: sql`COALESCE(${ambassadors.totalEarnings}, 0) + ${amount.toString()}`,
        totalReferrals: sql`COALESCE(${ambassadors.totalReferrals}, 0) + 1`,
      })
      .where(eq(ambassadors.id, ambassadorId));
  }

  async getAllAmbassadors(): Promise<Ambassador[]> {
    return db.select().from(ambassadors).orderBy(desc(ambassadors.createdAt));
  }

  async getAmbassadorPayouts(ambassadorId?: number): Promise<AmbassadorPayout[]> {
    if (ambassadorId) {
      return db
        .select()
        .from(ambassadorPayouts)
        .where(eq(ambassadorPayouts.ambassadorId, ambassadorId))
        .orderBy(desc(ambassadorPayouts.createdAt));
    }
    return db.select().from(ambassadorPayouts).orderBy(desc(ambassadorPayouts.createdAt));
  }

  async createAmbassadorPayout(data: InsertAmbassadorPayout): Promise<AmbassadorPayout> {
    const [payout] = await db.insert(ambassadorPayouts).values(data).returning();
    
    // Reduce pending payout for the ambassador
    await db
      .update(ambassadors)
      .set({
        pendingPayout: sql`GREATEST(0, COALESCE(${ambassadors.pendingPayout}, 0) - ${data.amount})`,
      })
      .where(eq(ambassadors.id, data.ambassadorId!));
    
    return payout;
  }

  async markAmbassadorPayoutCompleted(payoutId: number, reference: string): Promise<void> {
    await db
      .update(ambassadorPayouts)
      .set({
        status: 'completed',
        payoutReference: reference,
        processedAt: new Date(),
      })
      .where(eq(ambassadorPayouts.id, payoutId));
  }

  async createAmbassadorReferral(ambassadorId: number, referredUserId: number, subscriptionAmount: number, commissionEarned: number, subscriptionTier?: string): Promise<void> {
    await db.insert(ambassadorReferrals).values({
      ambassadorId,
      referredUserId,
      subscriptionTier: subscriptionTier || null,
      subscriptionAmount: subscriptionAmount.toString(),
      commissionEarned: commissionEarned.toString(),
      status: 'pending',
    });
  }

  // Badges
  async getBadgeByKey(key: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.key, key));
    return badge;
  }

  async createBadge(data: InsertBadge): Promise<Badge> {
    const [badge] = await db.insert(badges).values(data).returning();
    return badge;
  }

  async getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge })[]> {
    const result = await db
      .select({
        id: userBadges.id,
        userId: userBadges.userId,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        badge: badges,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));
    
    return result.map(r => ({
      id: r.id,
      userId: r.userId,
      badgeId: r.badgeId,
      earnedAt: r.earnedAt,
      badge: r.badge,
    }));
  }

  async hasBadge(userId: number, badgeKey: string): Promise<boolean> {
    const badge = await this.getBadgeByKey(badgeKey);
    if (!badge) return false;
    
    const [existing] = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id)));
    
    return !!existing;
  }

  async assignBadge(userId: number, badgeKey: string): Promise<UserBadge | undefined> {
    // Get or create the badge
    let badge = await this.getBadgeByKey(badgeKey);
    
    if (!badge) {
      // Create default MVP badge if it doesn't exist
      if (badgeKey === 'mvp') {
        badge = await this.createBadge({
          key: 'mvp',
          name: 'MVP',
          description: 'Official MVP team member or ambassador',
          icon: '🏆',
          category: 'special',
          xpReward: 500,
        });
      } else {
        return undefined;
      }
    }
    
    // Check if user already has badge
    const hasBadge = await this.hasBadge(userId, badgeKey);
    if (hasBadge) return undefined;
    
    // Assign badge
    const [userBadge] = await db
      .insert(userBadges)
      .values({ userId, badgeId: badge.id })
      .returning();
    
    return userBadge;
  }

  // Referral Stats
  async getAmbassadorReferrals(ambassadorId: number): Promise<any[]> {
    const referrals = await db
      .select({
        id: ambassadorReferrals.id,
        referredUserId: ambassadorReferrals.referredUserId,
        subscriptionAmount: ambassadorReferrals.subscriptionAmount,
        commissionEarned: ambassadorReferrals.commissionEarned,
        status: ambassadorReferrals.status,
        createdAt: ambassadorReferrals.createdAt,
        referredUser: {
          email: users.email,
          username: users.username,
        },
      })
      .from(ambassadorReferrals)
      .leftJoin(users, eq(ambassadorReferrals.referredUserId, users.id))
      .where(eq(ambassadorReferrals.ambassadorId, ambassadorId))
      .orderBy(desc(ambassadorReferrals.createdAt));
    
    return referrals;
  }

  async getAmbassadorStats(): Promise<{ ambassadorId: number; referralCount: number; totalCommission: number }[]> {
    const stats = await db
      .select({
        ambassadorId: ambassadorReferrals.ambassadorId,
        referralCount: sql<number>`count(*)::int`,
        totalCommission: sql<number>`COALESCE(sum(${ambassadorReferrals.commissionEarned}::numeric), 0)::float`,
      })
      .from(ambassadorReferrals)
      .groupBy(ambassadorReferrals.ambassadorId);
    
    return stats.map(s => ({
      ambassadorId: s.ambassadorId!,
      referralCount: s.referralCount,
      totalCommission: s.totalCommission,
    }));
  }

  async checkAndAwardBonusMilestones(ambassadorId: number): Promise<{ bonusType: string; amount: number } | null> {
    const [ambassador] = await db.select().from(ambassadors).where(eq(ambassadors.id, ambassadorId));
    if (!ambassador) return null;

    const totalReferrals = ambassador.totalReferrals || 0;

    // Check milestones in order (highest first to award the most valuable unclaimed)
    if (totalReferrals >= 100 && !ambassador.bonus100Referrals) {
      await db.update(ambassadors).set({
        bonus100Referrals: true,
        totalBonusEarned: sql`COALESCE(${ambassadors.totalBonusEarned}, 0) + 1500`,
        pendingPayout: sql`COALESCE(${ambassadors.pendingPayout}, 0) + 1500`,
      }).where(eq(ambassadors.id, ambassadorId));
      return { bonusType: '100_referrals', amount: 1500 };
    }

    if (totalReferrals >= 50 && !ambassador.bonus50Referrals) {
      await db.update(ambassadors).set({
        bonus50Referrals: true,
        totalBonusEarned: sql`COALESCE(${ambassadors.totalBonusEarned}, 0) + 500`,
        pendingPayout: sql`COALESCE(${ambassadors.pendingPayout}, 0) + 500`,
      }).where(eq(ambassadors.id, ambassadorId));
      return { bonusType: '50_referrals', amount: 500 };
    }

    if (totalReferrals >= 25 && !ambassador.bonus25Referrals) {
      await db.update(ambassadors).set({
        bonus25Referrals: true,
        totalBonusEarned: sql`COALESCE(${ambassadors.totalBonusEarned}, 0) + 300`,
        pendingPayout: sql`COALESCE(${ambassadors.pendingPayout}, 0) + 300`,
      }).where(eq(ambassadors.id, ambassadorId));
      return { bonusType: '25_referrals', amount: 300 };
    }

    // Check 5 Elite users in 30 days bonus
    // Matches both 'elite' and any elite-variant tiers
    if (!ambassador.bonus5Elite) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const eliteReferralsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(ambassadorReferrals)
        .where(
          and(
            eq(ambassadorReferrals.ambassadorId, ambassadorId),
            sql`LOWER(${ambassadorReferrals.subscriptionTier}) LIKE '%elite%'`,
            gte(ambassadorReferrals.createdAt, thirtyDaysAgo)
          )
        );
      
      const eliteCount = eliteReferralsResult[0]?.count || 0;
      
      if (eliteCount >= 5) {
        await db.update(ambassadors).set({
          bonus5Elite: true,
          eliteReferrals30Days: eliteCount,
          totalBonusEarned: sql`COALESCE(${ambassadors.totalBonusEarned}, 0) + 150`,
          pendingPayout: sql`COALESCE(${ambassadors.pendingPayout}, 0) + 150`,
        }).where(eq(ambassadors.id, ambassadorId));
        return { bonusType: '5_elite_30_days', amount: 150 };
      }
    }

    return null;
  }

  async updateAmbassadorTier(ambassadorId: number): Promise<string> {
    const [ambassador] = await db.select().from(ambassadors).where(eq(ambassadors.id, ambassadorId));
    if (!ambassador) return 'rookie';

    const totalReferrals = ambassador.totalReferrals || 0;
    let newTier = 'rookie';

    if (totalReferrals >= 100) {
      newTier = 'icon';
    } else if (totalReferrals >= 51) {
      newTier = 'legend';
    } else if (totalReferrals >= 26) {
      newTier = 'elite';
    } else if (totalReferrals >= 11) {
      newTier = 'pro';
    }

    if (newTier !== ambassador.tier) {
      await db.update(ambassadors).set({ tier: newTier }).where(eq(ambassadors.id, ambassadorId));
    }

    return newTier;
  }

  // Password Reset
  async createPasswordResetToken(data: { userId: number; token: string; expiresAt: Date }): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values({
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
    }).returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [result] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return result;
  }

  async markPasswordResetTokenUsed(tokenId: number): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, tokenId));
  }

  async getPendingPasswordResets(): Promise<{ id: number; email: string; token: string; expiresAt: Date; createdAt: Date }[]> {
    const now = new Date();
    const results = await db
      .select({
        id: passwordResetTokens.id,
        email: users.email,
        token: passwordResetTokens.token,
        expiresAt: passwordResetTokens.expiresAt,
        createdAt: passwordResetTokens.createdAt,
      })
      .from(passwordResetTokens)
      .innerJoin(users, eq(passwordResetTokens.userId, users.id))
      .where(
        and(
          gt(passwordResetTokens.expiresAt, now),
          sql`${passwordResetTokens.usedAt} IS NULL`
        )
      )
      .orderBy(desc(passwordResetTokens.createdAt));
    
    return results.map(r => ({
      id: r.id,
      email: r.email,
      token: r.token,
      expiresAt: r.expiresAt!,
      createdAt: r.createdAt!,
    }));
  }
}

export const storage = new DatabaseStorage();
