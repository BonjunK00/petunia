import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const { DISCORD_TOKEN, DISCORD_APP_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_APP_ID || !DISCORD_GUILD_ID) {
  console.error('Missing required env vars: DISCORD_TOKEN, DISCORD_APP_ID, DISCORD_GUILD_ID');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Show current service status')
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

await rest.put(Routes.applicationGuildCommands(DISCORD_APP_ID, DISCORD_GUILD_ID), {
  body: commands,
});

console.log('Commands registered successfully.');
