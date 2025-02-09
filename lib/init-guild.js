const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { addGuild } = require('./db');

module.exports = async (guild) => {
  // Record the guild in the database
  await addGuild(guild.id);

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