import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } from 'discord.js';
import { storage } from '../storage';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

let isReady = false;

export async function initializeDiscordBot() {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.log('⚠️ Discord bot token not found - bot disabled');
    return;
  }

  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
    
    client.once('ready', () => {
      console.log(`✅ Discord bot is online as ${client.user?.tag}!`);
      isReady = true;
    });

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === 'link') {
        const code = interaction.options.getString('code');
        
        if (!code) {
          await interaction.reply({
            content: '❌ Please provide your linking code from EV Scanner settings.',
            ephemeral: true,
          });
          return;
        }

        const [userIdStr, linkCode] = code.split('-');
        const userId = parseInt(userIdStr);
        
        if (!userId || !linkCode) {
          await interaction.reply({
            content: '❌ Invalid linking code format. Please check and try again.',
            ephemeral: true,
          });
          return;
        }

        try {
          const user = await storage.getUser(userId);
          
          if (!user) {
            await interaction.reply({
              content: '❌ Invalid linking code. Please generate a new one from Settings.',
              ephemeral: true,
            });
            return;
          }

          if (user.subscriptionTier !== 'premium' && user.subscriptionTier !== 'elite') {
            await interaction.reply({
              content: `❌ Discord bot requires Premium or Elite subscription.\n\nUpgrade at: ${process.env.CLIENT_URL || 'https://evscanner.app'}/pricing`,
              ephemeral: true,
            });
            return;
          }

          await storage.updateUser(userId, {
            discordUserId: interaction.user.id,
            discordUsername: interaction.user.username,
          });

          await interaction.reply({
            content: `✅ Account linked successfully!\n\nYou'll now receive EV picks directly in DMs.\n\nYour Discord ID: ${interaction.user.id}`,
            ephemeral: true,
          });
        } catch (error) {
          console.error('Discord link error:', error);
          await interaction.reply({
            content: '❌ Failed to link account. Please try again.',
            ephemeral: true,
          });
        }
      }

      if (interaction.commandName === 'status') {
        try {
          const users = await storage.getUserByDiscordId(interaction.user.id);
          
          if (!users) {
            await interaction.reply({
              content: '❌ Account not linked. Use /link with your code from EV Scanner settings.',
              ephemeral: true,
            });
            return;
          }

          await interaction.reply({
            content: `📊 **Account Status**\n\n👤 Username: ${users.username || 'Not set'}\n📧 Email: ${users.email}\n⭐ Tier: ${users.subscriptionTier?.toUpperCase()}\n✅ Status: Active`,
            ephemeral: true,
          });
        } catch (error) {
          await interaction.reply({
            content: '❌ Error fetching status. Please try again.',
            ephemeral: true,
          });
        }
      }

      if (interaction.commandName === 'picks') {
        try {
          const user = await storage.getUserByDiscordId(interaction.user.id);
          
          if (!user) {
            await interaction.reply({
              content: '❌ Account not linked. Use /link first.',
              ephemeral: true,
            });
            return;
          }

          const picks = await storage.getTopPicks('all', 5);
          
          if (!picks || picks.length === 0) {
            await interaction.reply({
              content: '📊 No picks available right now. Check back soon!',
              ephemeral: true,
            });
            return;
          }

          const embed = new EmbedBuilder()
            .setColor(0x00FF7F)
            .setTitle('🎯 Today\'s Top EV Picks')
            .setDescription('Here are the best opportunities right now')
            .addFields(
              picks.map((pick: any, index: number) => ({
                name: `${index + 1}. ${pick.sport} - ${pick.evPercent}% EV`,
                value: `${pick.selection}\n${pick.market} @ ${pick.bestOdds} (${pick.bestBook})`,
                inline: false,
              }))
            )
            .setFooter({ text: 'EV Scanner • Premium' })
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
          await interaction.reply({
            content: '❌ Error fetching picks. Please try again.',
            ephemeral: true,
          });
        }
      }
    });

    client.on('error', (error) => {
      console.error('Discord client error:', error);
    });

  } catch (error) {
    console.error('❌ Discord bot error:', error);
  }
}

export async function registerDiscordCommands() {
  if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_CLIENT_ID) {
    console.log('⚠️ Discord credentials missing - skipping command registration');
    return;
  }

  const commands = [
    new SlashCommandBuilder()
      .setName('link')
      .setDescription('Link your EV Scanner account to receive picks')
      .addStringOption(option =>
        option
          .setName('code')
          .setDescription('Your linking code from EV Scanner settings')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('status')
      .setDescription('Check your account status and settings'),
    new SlashCommandBuilder()
      .setName('picks')
      .setDescription('Get today\'s top EV picks'),
  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

  try {
    console.log('🔄 Registering Discord slash commands...');
    
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands }
    );

    console.log('✅ Discord commands registered!');
  } catch (error) {
    console.error('❌ Failed to register Discord commands:', error);
  }
}

export async function sendDiscordPick(discordUserId: string, pick: any) {
  if (!isReady) {
    console.log('Discord bot not ready');
    return;
  }

  try {
    const user = await client.users.fetch(discordUserId);
    
    const embed = new EmbedBuilder()
      .setColor(pick.evPercent >= 5 ? 0x00FF7F : 0x00CFFF)
      .setTitle(`🎯 New ${pick.evPercent >= 5 ? 'HIGH-EV' : 'EV'} Pick`)
      .setDescription(`**${pick.sport}**`)
      .addFields(
        { name: 'Selection', value: pick.selection, inline: false },
        { name: 'Market', value: pick.market, inline: true },
        { name: 'Odds', value: String(pick.bestOdds), inline: true },
        { name: 'Sportsbook', value: pick.bestBook, inline: true },
        { name: 'Expected Value', value: `**${pick.evPercent}%**`, inline: true },
      )
      .setFooter({ text: 'EV Scanner • Premium' })
      .setTimestamp();

    await user.send({ embeds: [embed] });
    console.log(`✅ Sent Discord pick to ${discordUserId}`);
  } catch (error) {
    console.error(`❌ Failed to send Discord message to ${discordUserId}:`, error);
  }
}

export async function sendDiscordBatch(discordUserId: string, picks: any[]) {
  if (!isReady || picks.length === 0) return;

  try {
    const user = await client.users.fetch(discordUserId);
    
    const embed = new EmbedBuilder()
      .setColor(0x00CFFF)
      .setTitle(`📊 ${picks.length} New EV Picks Available`)
      .setDescription('Check out the latest opportunities!')
      .addFields(
        picks.slice(0, 5).map(pick => ({
          name: `${pick.sport} • ${pick.evPercent}% EV`,
          value: `${pick.selection}\n${pick.market}: ${pick.bestOdds} (${pick.bestBook})`,
          inline: false,
        }))
      )
      .setFooter({ text: `View all at ${process.env.CLIENT_URL || 'evscanner.app'}` })
      .setTimestamp();

    if (picks.length > 5) {
      embed.addFields({
        name: '\u200B',
        value: `_+ ${picks.length - 5} more picks available on the app_`,
        inline: false,
      });
    }

    await user.send({ embeds: [embed] });
    console.log(`✅ Sent Discord batch to ${discordUserId}`);
  } catch (error) {
    console.error(`❌ Failed to send Discord batch to ${discordUserId}:`, error);
  }
}

export { client as discordClient };
