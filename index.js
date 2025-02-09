const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require('discord.js');
const { addUser } = require('./lib/db');

const createContest = require('./lib/commands/create-contest');
const sendSubmission = require('./lib/commands/send-submission');
const initializeGuild = require('./lib/init-guild');
const submitWallet = require('./lib/commands/submit-wallet');
const enterContest = require('./lib/commands/enter-contest');

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('DISCORD_BOT_TOKEN is not set in the environment variables.');
  process.exit(1);
}

const dbPath = path.resolve(__dirname, 'game.db');
if (!fs.existsSync(dbPath)) {
  console.error('game.db does not exist. Please run init_db.js first.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('guildCreate', async guild => {
  await initializeGuild(guild);
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await initializeGuild(guild);
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  await addUser(message.author.id);

  if (message.channel.type === ChannelType.GuildText && message.channel.name === 'game-host' && message.member && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return createContest(message);
  }
  if (message.channel.isThread() && message.channel.name.startsWith('Submission -')) {
    return sendSubmission(client, message);
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isModalSubmit() && interaction.customId.startsWith('wallet_modal::')) {
    return submitWallet(interaction);
  }
  if (interaction.isButton() && interaction.customId === 'enter_contest') {
    return enterContest(interaction);
  }

  console.log("Unknown interaction", interaction);
});

client.login(token);
