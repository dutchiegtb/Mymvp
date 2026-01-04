import { Router, Request, Response } from 'express';
import { storage } from './storage';
import crypto from 'crypto';

const router = Router();

router.post('/generate-code', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscriptionTier !== 'elite') {
      return res.status(403).json({ 
        error: 'Telegram AI Assistant requires Elite subscription',
        upgradeUrl: '/pricing'
      });
    }

    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const linkingCode = `${userId}-${code}`;

    res.json({ 
      code: linkingCode,
      botUsername: 'EVScannerBot',
      expiresIn: 600,
      instructions: [
        '1. Open Telegram',
        '2. Search for @EVScannerBot',
        '3. Click Start',
        '4. Send this code to the bot',
        '5. Done! Ask the AI anything'
      ]
    });
  } catch (error) {
    console.error('Telegram generate code error:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

router.post('/unlink', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscriptionTier !== 'elite') {
      return res.status(403).json({ 
        error: 'Telegram AI Assistant requires Elite subscription',
        upgradeUrl: '/pricing'
      });
    }

    await storage.updateUser(userId, {
      telegramChatId: null,
      telegramUsername: null,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Telegram unlink error:', error);
    res.status(500).json({ error: 'Failed to unlink Telegram' });
  }
});

router.post('/settings', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { minEV, quietHours, instantAlerts } = req.body;
  
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const currentUser = await storage.getUser(userId);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.subscriptionTier !== 'elite') {
      return res.status(403).json({ 
        error: 'Telegram AI Assistant requires Elite subscription',
        upgradeUrl: '/pricing'
      });
    }

    const currentSettings = currentUser.notificationSettings as any || {};
    const updatedSettings = {
      ...currentSettings,
      telegram: {
        enabled: true,
        frequency: instantAlerts ? 'instant' : 'hourly',
        minEV: minEV || 5,
        quietHours: quietHours || { start: '22:00', end: '08:00' },
      }
    };

    await storage.updateUser(userId, { 
      notificationSettings: updatedSettings,
    });

    res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('Telegram settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await storage.getUser(userId);
    const settings = user?.notificationSettings as any;
    
    res.json({
      connected: !!user?.telegramChatId,
      telegramUsername: user?.telegramUsername || null,
      settings: settings?.telegram || null,
    });
  } catch (error) {
    console.error('Telegram status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
