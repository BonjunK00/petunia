import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { handleStatus } from './commands/status.js';

const { DISCORD_TOKEN, ALLOWED_GUILD_IDS } = process.env;

if (!DISCORD_TOKEN) {
  console.error('Missing required env var: DISCORD_TOKEN');
  process.exit(1);
}

const allowedGuilds = ALLOWED_GUILD_IDS
  ? new Set(ALLOWED_GUILD_IDS.split(',').map((id) => id.trim()).filter(Boolean))
  : new Set<string>();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (allowedGuilds.size > 0 && (!interaction.guildId || !allowedGuilds.has(interaction.guildId))) {
    return;
  }

  if (interaction.commandName === 'status') {
    await handleStatus(interaction);
  }
});

await client.login(DISCORD_TOKEN);
