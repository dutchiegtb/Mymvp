// Feature access control helper
// Admins bypass all tier restrictions

export type SubscriptionTier = 'free' | 'basic' | 'web' | 'premium' | 'elite' | 'ambassador' | 'lifetime_elite';
export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

export interface UserAccess {
  subscriptionTier: string;
  role?: string;
  isAdmin?: boolean;
}

// Tier hierarchy for comparison
const TIER_HIERARCHY: Record<string, number> = {
  free: 0,
  basic: 1,
  web: 1,
  premium: 2,
  elite: 3,
  ambassador: 3,
  lifetime_elite: 3,
};

// Feature requirements by tier
const FEATURE_REQUIREMENTS: Record<string, string[]> = {
  // Basic features (all tiers)
  'account_settings': ['free', 'basic', 'web', 'premium', 'elite', 'ambassador'],
  'notifications_basic': ['free', 'basic', 'web', 'premium', 'elite', 'ambassador'],
  
  // Basic+ features
  'parlay_settings': ['basic', 'web', 'premium', 'elite', 'ambassador'],
  'parlay_unlimited': ['premium', 'elite', 'ambassador'],
  
  // Premium features
  'discord_bot': ['premium', 'elite', 'ambassador'],
  'unlimited_picks': ['premium', 'elite', 'ambassador'],
  
  // Phase 1-2 Features (Premium+)
  'best_bets': ['premium', 'elite', 'ambassador', 'lifetime_elite'],
  'sharp_action': ['premium', 'elite', 'ambassador', 'lifetime_elite'],
  'public_betting': ['premium', 'elite', 'ambassador', 'lifetime_elite'],
  'officials_basic': ['premium', 'elite', 'ambassador', 'lifetime_elite'],
  'line_movement': ['premium', 'elite', 'ambassador', 'lifetime_elite'],
  'trends_full': ['premium', 'elite', 'ambassador', 'lifetime_elite'],
  'hold_calculator': ['premium', 'elite', 'ambassador', 'lifetime_elite'],
  
  // Preview features (Basic gets preview, Premium+ gets full)
  'best_bets_preview': ['basic', 'web', 'premium', 'elite', 'ambassador', 'lifetime_elite'],
  'officials_preview': ['basic', 'web', 'premium', 'elite', 'ambassador', 'lifetime_elite'],
  'trends_preview': ['basic', 'web', 'premium', 'elite', 'ambassador', 'lifetime_elite'],
  
  // Elite features
  'telegram_ai': ['elite', 'ambassador', 'lifetime_elite'],
  'advanced_analytics': ['elite', 'ambassador', 'lifetime_elite'],
  'officials_auto': ['elite', 'ambassador', 'lifetime_elite'],
  'clv_tracking': ['elite', 'ambassador', 'lifetime_elite'],
  'systems_builder': ['elite', 'ambassador', 'lifetime_elite'],
  
  // Ambassador features
  'ambassador_dashboard': ['ambassador'],
  
  // Admin features
  'admin_panel': [], // Only admins via role check
  'user_management': [], // Only admins via role check
  'system_settings': [], // Only admins via role check
};

// Feature access levels for UI rendering
export type FeatureAccessLevel = 'locked' | 'preview' | 'full';

export type FeatureName = 
  | 'best_bets'
  | 'sharp_action'
  | 'public_betting'
  | 'officials_basic'
  | 'line_movement'
  | 'trends'
  | 'hold_calculator'
  | 'officials_auto'
  | 'clv_tracking'
  | 'systems_builder';

/**
 * Get the access level for a specific feature based on user tier
 */
export function getFeatureAccessLevel(
  feature: FeatureName,
  user: UserAccess | null | undefined
): FeatureAccessLevel {
  // Admin and super_admin have full access to everything
  if (user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin') {
    return 'full';
  }

  const tier = (user?.subscriptionTier || 'free').toLowerCase();
  
  // Feature access map: defines what each tier gets for each feature
  const accessMap: Record<FeatureName, Record<string, FeatureAccessLevel>> = {
    best_bets: {
      free: 'preview',      // See 1 bet
      basic: 'preview',     // See 3 bets
      web: 'preview',
      premium: 'full',
      elite: 'full',
      ambassador: 'full',
      lifetime_elite: 'full'
    },
    sharp_action: {
      free: 'locked',
      basic: 'locked',
      web: 'locked',
      premium: 'full',
      elite: 'full',
      ambassador: 'full',
      lifetime_elite: 'full'
    },
    public_betting: {
      free: 'locked',
      basic: 'locked',
      web: 'locked',
      premium: 'full',
      elite: 'full',
      ambassador: 'full',
      lifetime_elite: 'full'
    },
    officials_basic: {
      free: 'preview',
      basic: 'preview',
      web: 'preview',
      premium: 'full',
      elite: 'full',
      ambassador: 'full',
      lifetime_elite: 'full'
    },
    line_movement: {
      free: 'locked',
      basic: 'locked',
      web: 'locked',
      premium: 'full',
      elite: 'full',
      ambassador: 'full',
      lifetime_elite: 'full'
    },
    trends: {
      free: 'locked',
      basic: 'preview',
      web: 'preview',
      premium: 'full',
      elite: 'full',
      ambassador: 'full',
      lifetime_elite: 'full'
    },
    hold_calculator: {
      free: 'locked',
      basic: 'locked',
      web: 'locked',
      premium: 'full',
      elite: 'full',
      ambassador: 'full',
      lifetime_elite: 'full'
    },
    officials_auto: {
      free: 'locked',
      basic: 'locked',
      web: 'locked',
      premium: 'locked',
      elite: 'full',
      ambassador: 'full',
      lifetime_elite: 'full'
    },
    clv_tracking: {
      free: 'locked',
      basic: 'locked',
      web: 'locked',
      premium: 'locked',
      elite: 'full',
      ambassador: 'full',
      lifetime_elite: 'full'
    },
    systems_builder: {
      free: 'locked',
      basic: 'locked',
      web: 'locked',
      premium: 'locked',
      elite: 'full',
      ambassador: 'full',
      lifetime_elite: 'full'
    }
  };

  return accessMap[feature]?.[tier] || 'locked';
}

/**
 * Get the number of items a user can see for preview features
 */
export function getPreviewLimit(
  feature: FeatureName,
  user: UserAccess | null | undefined
): number {
  const tier = (user?.subscriptionTier || 'free').toLowerCase();
  
  // Admin gets everything
  if (user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin') {
    return 999;
  }
  
  const previewLimits: Record<FeatureName, Record<string, number>> = {
    best_bets: {
      free: 1,
      basic: 3,
      web: 3,
      premium: 999,
      elite: 999,
      ambassador: 999,
      lifetime_elite: 999
    },
    trends: {
      free: 0,
      basic: 2,
      web: 2,
      premium: 999,
      elite: 999,
      ambassador: 999,
      lifetime_elite: 999
    },
    // Default for other features
    sharp_action: { free: 0, basic: 0, web: 0, premium: 999, elite: 999, ambassador: 999, lifetime_elite: 999 },
    public_betting: { free: 0, basic: 0, web: 0, premium: 999, elite: 999, ambassador: 999, lifetime_elite: 999 },
    officials_basic: { free: 1, basic: 1, web: 1, premium: 999, elite: 999, ambassador: 999, lifetime_elite: 999 },
    line_movement: { free: 0, basic: 0, web: 0, premium: 999, elite: 999, ambassador: 999, lifetime_elite: 999 },
    hold_calculator: { free: 0, basic: 0, web: 0, premium: 999, elite: 999, ambassador: 999, lifetime_elite: 999 },
    officials_auto: { free: 0, basic: 0, web: 0, premium: 0, elite: 999, ambassador: 999, lifetime_elite: 999 },
    clv_tracking: { free: 0, basic: 0, web: 0, premium: 0, elite: 999, ambassador: 999, lifetime_elite: 999 },
    systems_builder: { free: 0, basic: 0, web: 0, premium: 0, elite: 999, ambassador: 999, lifetime_elite: 999 }
  };
  
  return previewLimits[feature]?.[tier] || 0;
}

/**
 * Check if a user can access a specific feature
 * Admins and super_admins bypass ALL tier restrictions
 */
export function canAccessFeature(user: UserAccess | null | undefined, feature: string): boolean {
  if (!user) return false;
  
  // Admin bypass - admins and super_admins can access everything
  if (user.isAdmin || user.role === 'admin' || user.role === 'super_admin') {
    return true;
  }
  
  // Moderators get some elevated access (premium equivalent)
  if (user.role === 'moderator') {
    const moderatorFeatures = ['discord_bot', 'unlimited_picks', 'parlay_unlimited'];
    if (moderatorFeatures.includes(feature)) return true;
  }
  
  // Check tier-based access
  const allowedTiers = FEATURE_REQUIREMENTS[feature];
  if (!allowedTiers) return false;
  
  const userTier = user.subscriptionTier?.toLowerCase() || 'free';
  return allowedTiers.includes(userTier);
}

/**
 * Check if user is admin (admin or super_admin role)
 */
export function isUserAdmin(user: UserAccess | null | undefined): boolean {
  if (!user) return false;
  return user.isAdmin === true || user.role === 'admin' || user.role === 'super_admin';
}

/**
 * Check if user is super admin
 */
export function isUserSuperAdmin(user: UserAccess | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'super_admin';
}

/**
 * Check if user is at least moderator
 */
export function isUserModerator(user: UserAccess | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'moderator' || user.role === 'admin' || user.role === 'super_admin';
}

/**
 * Get the tier level for comparison
 */
export function getTierLevel(tier: string): number {
  return TIER_HIERARCHY[tier.toLowerCase()] || 0;
}

/**
 * Check if user tier meets minimum requirement
 */
export function hasTierAccess(user: UserAccess | null | undefined, minTier: string): boolean {
  if (!user) return false;
  
  // Admin bypass
  if (isUserAdmin(user)) return true;
  
  const userLevel = getTierLevel(user.subscriptionTier || 'free');
  const requiredLevel = getTierLevel(minTier);
  
  return userLevel >= requiredLevel;
}

/**
 * Get list of features user can access
 */
export function getUserFeatures(user: UserAccess | null | undefined): string[] {
  if (!user) return [];
  
  // Admins get all features
  if (isUserAdmin(user)) {
    return Object.keys(FEATURE_REQUIREMENTS);
  }
  
  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([feature]) => canAccessFeature(user, feature))
    .map(([feature]) => feature);
}

/**
 * Get upgrade prompt for a locked feature
 */
export function getUpgradePrompt(feature: string): { tier: string; message: string } {
  switch (feature) {
    case 'parlay_settings':
    case 'parlay_unlimited':
      return { tier: 'Basic', message: 'Upgrade to Basic to unlock parlay features' };
    case 'discord_bot':
    case 'unlimited_picks':
      return { tier: 'Premium', message: 'Upgrade to Premium to unlock Discord bot and unlimited picks' };
    case 'telegram_ai':
    case 'advanced_analytics':
      return { tier: 'Elite', message: 'Upgrade to Elite to unlock Telegram AI and advanced analytics' };
    case 'ambassador_dashboard':
      return { tier: 'Ambassador', message: 'Become an Ambassador to unlock the commission dashboard' };
    default:
      return { tier: 'Premium', message: 'Upgrade to unlock this feature' };
  }
}
