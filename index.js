require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ThreadAutoArchiveDuration, PermissionFlagsBits } = require('discord.js');
const { addGuild, addContest, addThread, addSubmission, getContestByChannel, updateContestButtonMessage, getLatestSubmission, getThreadByUser } = require('./db');

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('DISCORD_BOT_TOKEN is not set in the environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Add helper function to slugify contest titles
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')          // Replace spaces with -
    .replace(/[^\w\-]+/g, '')      // Remove all non-word chars
    .replace(/\-\-+/g, '-');       // Replace multiple - with single -
}

// Add a helper function to initialize a guild
async function initializeGuild(guild) {
  // Record the guild in the database
  addGuild(guild.id);
  
  // Check if a text channel named 'game-host' exists
  let gameHostChannel = guild.channels.cache.find(ch => ch.name === 'game-host' && ch.type === ChannelType.GuildText);
  
  // If not, create it with permissions so that only admins can see it
  if (!gameHostChannel) {
    gameHostChannel = await guild.channels.create({
      name: 'game-host',
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        }
      ]
    });
    console.log(`Created game-host channel in guild ${guild.id}`);
  }
}

// Listen for new guilds
client.on('guildCreate', async guild => {
  await initializeGuild(guild);
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Initialize every guild the bot is in
  for (const guild of client.guilds.cache.values()) {
    await initializeGuild(guild);
  }
});

// Listen for messages
client.on('messageCreate', async message => {
  // If message is in a game-host channel and sent by an admin, process it as contest data
  if (message.channel.type === ChannelType.GuildText && message.channel.name === 'game-host' && message.member && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    try {
      const contestData = JSON.parse(message.content);
      // Expecting contestData to have: title, description, entryFee, deadline
      if (!contestData.title || !contestData.description) {
        throw new Error('Missing required contest fields');
      }
      const titleSlug = slugify(contestData.title);
      const contestChannelName = `contest-${titleSlug}`;
      
      // Create a public text channel for the contest
      const contestChannel = await message.guild.channels.create({
        name: contestChannelName,
        type: ChannelType.GuildText,
        topic: `${contestData.title} - ${contestData.description}`
      });
      
      // Prepare the "Enter Contest" button
      const button = new ButtonBuilder()
        .setCustomId('enter_contest')
        .setLabel('Enter Contest')
        .setStyle(ButtonStyle.Primary);
      const row = new ActionRowBuilder().addComponents(button);
      
      // Send the contest announcement in the new channel with the button
      await contestChannel.send({ content: 'Enter Contest', components: [row] });
      
      // Record the contest in the database
      addContest(contestChannel.id, message.guild.id, contestChannel.id);
      
      // Confirm contest creation in the game-host channel
      await message.reply(`Contest created: <#${contestChannel.id}>`);
    } catch (err) {
      console.error('Failed to create contest:', err);
      await message.reply('Invalid contest JSON message. Please check your input.');
    }
    return; // Do not process further if message was contest creation
  }

  // Existing logic for handling submission threads
  if (message.author.bot) return;
  if (message.channel.isThread() && message.channel.name.startsWith('Submission -')) {
    // Delete the user's message
    await message.delete().catch(console.error);
    
    // Record the updated submission in the database
    addSubmission(message.channel.id, message.author.id, message.content);
    
    // Fetch latest submission from the database and update the bot message accordingly
    getLatestSubmission(message.channel.id, async (err, latestContent) => {
      if (err) {
        console.error('Error retrieving latest submission from DB:', err);
        return;
      }
      const newContent = `Your current submission is: ${latestContent}`;
      // Fetch recent messages in the thread to find the bot's submission message
      const messagesFetched = await message.channel.messages.fetch({ limit: 100 });
      const botSubmissionMsg = messagesFetched.find(m => m.author.id === client.user.id && m.content.startsWith('Your current submission is:'));
      if (botSubmissionMsg) {
        try {
          await botSubmissionMsg.edit(newContent);
        } catch (error) {
          console.error('Editing bot submission message failed:', error);
          await message.channel.send(newContent);
        }
      } else {
        await message.channel.send(newContent);
      }
    });
  }
});

// Existing interactionCreate event listener remains unchanged
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'enter_contest') {
    await interaction.deferReply({ ephemeral: true });
    const parentChannel = interaction.channel;
    if (!parentChannel) return;

    // Check if user already has a submission thread by querying the database
    const alreadyRegistered = await new Promise(resolve => {
      getThreadByUser(interaction.user.id, (err, row) => {
        if (err) {
          console.error('Error checking user thread:', err);
        }
        resolve(!!row);
      });
    });

    if (alreadyRegistered) {
      await interaction.editReply({ content: 'you are already registered' });
      return;
    }

    // If not registered, create a new thread as before
    const thread = await parentChannel.threads.create({
      name: `Submission - ${interaction.user.username}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      type: ChannelType.PrivateThread,
      invitable: false
    });

    // Add the user to the new private thread
    await thread.members.add(interaction.user.id);
    
    // Record the thread in the database
    addThread(thread.id, interaction.user.id);

    // Immediately send the bot's submission message
    await thread.send('Your current submission is: ');

    await interaction.editReply({ content: `Your submission thread has been created: <#${thread.id}>` });
  }
});

client.login(token);
