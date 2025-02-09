const { ThreadAutoArchiveDuration, ChannelType } = require('discord.js');
const { updateUserWallet, addThread } = require('../db');
const { getAddress } = require('viem');

module.exports = async (interaction) => {
    console.dir(interaction, { depth: null });
    const parentChannelId = interaction.customId.split('::')[1];
    let walletAddress;
    try {
        walletAddress = getAddress(interaction.fields.getTextInputValue('wallet_address'));
    } catch {
        await interaction.reply({ content: 'Error: Invalid wallet address. Make sure it starts with "0x" and contains 42 hexadecimal characters.', ephemeral: true });
        return;
    }

    // Update the user's wallet address in the database
    await updateUserWallet(interaction.user.id, walletAddress);

    // Now create the submission thread as we would normally
    const parentChannel = interaction.guild.channels.cache.get(parentChannelId);
    if (!parentChannel) {
      await interaction.reply({ content: 'Error: Could not find the contest channel.', ephemeral: true });
      return;
    }

    const thread = await parentChannel.threads.create({
      name: `Submission - ${interaction.user.username}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      type: ChannelType.PrivateThread,
      invitable: false
    });

    await thread.members.add(interaction.user.id);
    await addThread(thread.id, interaction.user.id);
    await thread.send('Your current submission is: ');

    await interaction.reply({ content: `Your wallet address has been registered and your submission thread has been created: <#${thread.id}>`, ephemeral: true });
}