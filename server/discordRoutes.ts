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

    if (user.subscriptionTier !== 'premium' && user.subscriptionTier !== 'elite') {
      return res.status(403).json({ 
        error: 'Discord bot requires Premium or Elite subscription',
        upgradeUrl: '/pricing'
      });
    }

    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const linkingCode = `${userId}-${code}`;

    res.json({ 
      code: linkingCode,
      expiresIn: 600,
      botInviteUrl: process.env.DISCORD_BOT_INVITE_URL,
      instructions: [
        '1. Open Discord',
        '2. Send a DM to EV Scanner Bot',
        '3. Type: /link code:YOUR_CODE',
        '4. Done! You\'ll receive picks here'
      ]
    });
  } catch (error) {
    console.error('Discord generate code error:', error);
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

    if (user.subscriptionTier !== 'premium' && user.subscriptionTier !== 'elite') {
      return res.status(403).json({ 
        error: 'Discord bot requires Premium or Elite subscription',
        upgradeUrl: '/pricing'
      });
    }

    await storage.updateUser(userId, {
      discordUserId: null,
      discordUsername: null,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Discord unlink error:', error);
    res.status(500).json({ error: 'Failed to unlink Discord' });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await storage.getUser(userId);
    
    res.json({
      connected: !!user?.discordUserId,
      discordUsername: user?.discordUsername || null,
    });
  } catch (error) {
    console.error('Discord status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
