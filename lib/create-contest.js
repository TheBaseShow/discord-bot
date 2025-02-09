const { ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { addContest }  = require('./db');
const { slugify } = require('./utils');

module.exports = async (message) => {
  try {
    const contestData = JSON.parse(message.content);
    if (!contestData.title || !contestData.description) {
      throw new Error('Missing required contest fields');
    }
    const titleSlug = slugify(contestData.title);
    const contestChannelName = `contest-${titleSlug}`;

    const contestChannel = await message.guild.channels.create({
      name: contestChannelName,
      type: ChannelType.GuildText,
      topic: `${contestData.title} - ${contestData.description}`
    });

    const button = new ButtonBuilder()
      .setCustomId('enter_contest')
      .setLabel('Enter Contest')
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(button);

    await contestChannel.send({ content: 'Enter Contest', components: [row] });

    await addContest(contestChannel.id, message.guild.id, contestData.title, contestData.description, contestData.entryFee, contestData.deadline);

    await message.reply(`Contest created: <#${contestChannel.id}>`);
  } catch (err) {
    console.error('Failed to create contest:', err);
    await message.reply('Error', err.message);
  }
}