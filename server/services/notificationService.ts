import { storage } from '../storage';
import { sendDiscordPick, sendDiscordBatch } from './discordBot';
import { sendTelegramPick, sendTelegramInstantAlert } from './telegramBot';
import type { TopPick } from '../../shared/schema';

interface NotificationSettings {
  discord?: {
    enabled: boolean;
    frequency: 'instant' | 'hourly' | 'daily';
    minEV: number;
  };
  telegram?: {
    enabled: boolean;
    frequency: 'instant' | 'hourly' | 'daily';
    minEV: number;
    quietHours?: { start: string; end: string };
  };
}

export async function notifyUsersOfNewPick(pick: TopPick) {
  console.log(`📢 Notifying users of new pick: ${pick.sport} - ${pick.evPercent}% EV`);

  try {
    const discordUsers = await storage.getUsersWithDiscord();
    
    for (const user of discordUsers) {
      if (user.subscriptionTier === 'premium' || user.subscriptionTier === 'elite') {
        if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
          try {
            await sendDiscordPick(user.discordUserId!, pick);
          } catch (error) {
            console.error(`Failed to send Discord pick to ${user.username}:`, error);
          }
        }
      }
    }

    const telegramUsers = await storage.getUsersWithTelegram();
    
    for (const user of telegramUsers) {
      if (user.subscriptionTier === 'elite') {
        if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
          try {
            const settings = user.notificationSettings as NotificationSettings | null;
            const minEV = settings?.telegram?.minEV || 5;

            if (Number(pick.evPercent) >= minEV) {
              if (!isQuietHours(settings?.telegram?.quietHours)) {
                if (Number(pick.evPercent) >= minEV && settings?.telegram?.frequency === 'instant') {
                  await sendTelegramInstantAlert(user.telegramChatId!, pick);
                } else {
                  await sendTelegramPick(user.telegramChatId!, pick);
                }
              }
            }
          } catch (error) {
            console.error(`Failed to send Telegram pick to ${user.username}:`, error);
          }
        }
      }
    }

    console.log(`✅ Notifications sent for pick: ${pick.selection}`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

function isQuietHours(quietHours?: { start: string; end: string }): boolean {
  if (!quietHours) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const { start, end } = quietHours;
  
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }
  
  return currentTime >= start && currentTime <= end;
}

export async function sendBatchUpdates(picks: TopPick[]) {
  if (picks.length === 0) return;

  try {
    const discordUsers = await storage.getUsersWithDiscord();

    for (const user of discordUsers) {
      if (user.subscriptionTier === 'premium' || user.subscriptionTier === 'elite') {
        try {
          await sendDiscordBatch(user.discordUserId!, picks);
        } catch (error) {
          console.error(`Failed to send Discord batch to ${user.username}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error sending batch updates:', error);
  }
}
