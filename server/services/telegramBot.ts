import TelegramBot from 'node-telegram-bot-api';
import Anthropic from '@anthropic-ai/sdk';
import { storage } from '../storage';
import type { User } from '../../shared/schema';

let bot: TelegramBot | null = null;
let anthropic: Anthropic | null = null;

export async function initializeTelegramBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️ Telegram bot token not found - bot disabled');
    return;
  }

  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  
  if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  console.log('✅ Telegram bot is online!');

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    await bot!.sendMessage(chatId, `
🎯 Welcome to EV Scanner!

To link your Elite account:
1. Go to Settings in the EV Scanner app
2. Copy your linking code
3. Send it here

Once linked, you can:
💬 Ask me anything about betting
📊 Get personalized pick recommendations
🎯 Receive instant high-EV alerts

Try asking: "What are today's best NBA picks?"
    `);
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return;

    if (text.match(/^\d+-[A-F0-9]{8}$/i)) {
      const [userIdStr] = text.split('-');
      const userId = parseInt(userIdStr);

      try {
        const user = await storage.getUser(userId);

        if (!user) {
          await bot!.sendMessage(chatId, '❌ Invalid linking code. Please check and try again.');
          return;
        }

        if (user.subscriptionTier !== 'elite') {
          await bot!.sendMessage(chatId, `
❌ Telegram AI Assistant is exclusive to Elite members.

You're currently on the ${user.subscriptionTier} plan.

Upgrade to Elite to unlock:
🤖 AI-powered betting advisor
⚡ Instant high-EV alerts
📊 Advanced analytics
🎯 Priority picks

Upgrade at: ${process.env.CLIENT_URL || 'https://evscanner.app'}/pricing
          `);
          return;
        }

        await storage.updateUser(userId, {
          telegramChatId: chatId.toString(),
          telegramUsername: msg.from?.username || '',
        });

        await bot!.sendMessage(chatId, `
✅ Account linked successfully!

Your Elite AI Assistant is ready. Try asking:
• "What are today's best NBA picks?"
• "Should I bet this parlay?"
• "Explain what makes a good EV bet"

You'll also receive instant alerts for high-EV picks (5%+).

Type /help to see all commands.
        `);

      } catch (error) {
        console.error('Telegram link error:', error);
        await bot!.sendMessage(chatId, '❌ Failed to link account. Please try again.');
      }
      return;
    }

    const user = await storage.getUserByTelegramChatId(chatId.toString());

    if (!user) {
      await bot!.sendMessage(chatId, `
⚠️ Account not linked.

To use the AI Assistant:
1. Go to Settings in EV Scanner
2. Generate a linking code
3. Send it here

Not an Elite member yet? Upgrade at: ${process.env.CLIENT_URL || 'https://evscanner.app'}/pricing
      `);
      return;
    }

    if (user.subscriptionTier !== 'elite') {
      await bot!.sendMessage(chatId, `
❌ Your Elite subscription has ended.

Reactivate to continue using the AI Assistant: ${process.env.CLIENT_URL || 'https://evscanner.app'}/pricing
      `);
      return;
    }

    await handleAIQuery(chatId, text, user);
  });

  bot.onText(/\/help/, async (msg) => {
    await bot!.sendMessage(msg.chat.id, `
🤖 EV Scanner AI Assistant Commands

/start - Link your account
/help - Show this help message
/status - Check your account status
/picks - Get today's top picks

Or just ask me anything:
• "Best NFL picks today?"
• "Analyze this parlay for me"
• "What's Kelly Criterion?"
• "Why did my pick lose?"

💡 Tip: The more specific your question, the better my answer!
    `);
  });

  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    
    const user = await storage.getUserByTelegramChatId(chatId.toString());

    if (!user) {
      await bot!.sendMessage(chatId, '❌ Account not linked. Send /start to begin.');
      return;
    }

    await bot!.sendMessage(chatId, `
📊 Account Status

Username: ${user.username || 'Not set'}
Tier: ${user.subscriptionTier?.toUpperCase()} ${user.subscriptionTier === 'elite' ? '👑' : ''}
Status: ${user.subscriptionStatus || 'Active'}

AI Assistant: ${user.subscriptionTier === 'elite' ? '✅ Enabled' : '❌ Elite only'}
Instant Alerts: ${user.subscriptionTier === 'elite' ? '✅ Enabled' : '❌ Elite only'}
    `);
  });

  bot.onText(/\/picks/, async (msg) => {
    const chatId = msg.chat.id;
    
    const user = await storage.getUserByTelegramChatId(chatId.toString());

    if (!user) {
      await bot!.sendMessage(chatId, '❌ Account not linked.');
      return;
    }

    try {
      const picks = await storage.getTopPicks('all', 5);
      
      if (!picks || picks.length === 0) {
        await bot!.sendMessage(chatId, '📊 No picks available right now. Check back soon!');
        return;
      }

      let message = '🎯 *Today\'s Top Picks*\n\n';
      picks.forEach((pick: any, index: number) => {
        message += `*${index + 1}. ${pick.sport} - ${pick.evPercent}% EV*\n`;
        message += `${pick.selection}\n`;
        message += `${pick.market} @ ${pick.bestOdds} (${pick.bestBook})\n\n`;
      });

      await bot!.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot!.sendMessage(chatId, '❌ Error fetching picks. Please try again.');
    }
  });

  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error);
  });
}

async function handleAIQuery(chatId: number, query: string, user: User) {
  if (!anthropic || !bot) return;

  try {
    await bot.sendChatAction(chatId, 'typing');

    const picks = await storage.getTopPicks('all', 3);
    const picksContext = picks?.map((p: any) => 
      `${p.sport}: ${p.selection} - ${p.evPercent}% EV @ ${p.bestOdds} (${p.bestBook})`
    ).join('\n') || 'No picks currently available';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an expert sports betting advisor for EV Scanner, a tool that finds positive expected value bets.

User: ${user.username || 'Elite Member'}
Current Top Picks:
${picksContext}

User question: ${query}

Provide a helpful, concise answer about betting strategy, EV analysis, or sports picks. Be conversational but professional. If they ask about specific player props or games, provide analysis based on EV principles.

Keep responses under 500 words. Use minimal formatting for Telegram compatibility.`
      }]
    });

    const answer = response.content[0].type === 'text' ? response.content[0].text : 'Sorry, I couldn\'t process that.';

    if (answer.length > 4000) {
      const chunks = answer.match(/.{1,4000}/g) || [];
      for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk);
      }
    } else {
      await bot.sendMessage(chatId, answer);
    }

  } catch (error) {
    console.error('AI query error:', error);
    await bot!.sendMessage(chatId, `
❌ Sorry, I encountered an error processing your question.

Please try rephrasing or ask something else. If the problem persists, contact support.
    `);
  }
}

export async function sendTelegramPick(chatId: string, pick: any) {
  if (!bot) return;

  try {
    const message = `
🔥 *NEW ${pick.evPercent >= 5 ? 'HIGH-EV' : 'EV'} PICK* (${pick.evPercent}% EV)

*${pick.sport}*
${pick.selection}

*Bet:* ${pick.market}
*Odds:* ${pick.bestOdds}
*Sportsbook:* ${pick.bestBook}

${pick.reasoning || ''}
    `;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`✅ Sent Telegram pick to ${chatId}`);
  } catch (error) {
    console.error(`❌ Failed to send Telegram pick to ${chatId}:`, error);
  }
}

export async function sendTelegramInstantAlert(chatId: string, pick: any) {
  if (!bot) return;

  try {
    const message = `
⚡ *INSTANT ALERT* ⚡

🎯 *${pick.evPercent}% EV* - ${pick.sport}

${pick.selection}
${pick.market}: *${pick.bestOdds}*

Book: ${pick.bestBook}

🔥 *ACT FAST* - High-EV picks move quickly!

View full analysis: ${process.env.CLIENT_URL || 'https://evscanner.app'}/dashboard
    `;

    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (error) {
    console.error('Telegram instant alert error:', error);
  }
}

export { bot as telegramBot };
