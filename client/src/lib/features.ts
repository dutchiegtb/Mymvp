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
  
  // Elite features
  'telegram_ai': ['elite', 'ambassador', 'lifetime_elite'],
  'advanced_analytics': ['elite', 'ambassador', 'lifetime_elite'],
  
  // Ambassador features
  'ambassador_dashboard': ['ambassador'],
  
  // Admin features
  'admin_panel': [], // Only admins via role check
  'user_management': [], // Only admins via role check
  'system_settings': [], // Only admins via role check
};

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
