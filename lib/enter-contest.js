const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, ThreadAutoArchiveDuration, ChannelType } = require('discord.js');
const { getUserWallet, getThreadByUserAndChannel, addThread }  = require('./db');

module.exports = async (interaction) => {
    console.dir(interaction, { depth: null });
    const parentChannel = interaction.channel;
    if (!parentChannel) return;

    try {
      const walletAddress = await getUserWallet(interaction.user.id);

      if (!walletAddress) {
        const modal = new ModalBuilder()
          .setCustomId(`wallet_modal::${parentChannel.id}`)
          .setTitle('Wallet Address Required');

        const walletInput = new TextInputBuilder()
          .setCustomId('wallet_address')
          .setLabel('Please enter your wallet address')
          .setPlaceholder('0x...')
          .setMinLength(42)
          .setMaxLength(42)
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(walletInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
        return;
      }
      await interaction.deferReply({ ephemeral: true });

      const existingThread = await getThreadByUserAndChannel(interaction.user.id, parentChannel.id);

      if (existingThread) {
        await interaction.editReply({ content: 'You are already registered for this contest.' });
        return;
      }

      const thread = await parentChannel.threads.create({
        name: `Submission - ${interaction.user.username}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
        type: ChannelType.PrivateThread,
        invitable: false
      });

      await thread.members.add(interaction.user.id);

      await addThread(thread.id, parentChannel.id, interaction.user.id);

      await thread.send([
        'Send your submissions here. Every message you send will be treated as your new submission,',
        'overriding the previous one and your message will be deleted. Upon receiving a submission,',
        'a unique ID will be assigned to it and a signature will be provided. You can use that ID',
        'and signature to confirm your submission on the contests smart contract'
      ].join(' '));

      await interaction.editReply({ content: `Your submission thread has been created: <#${thread.id}>` });
    } catch (err) {
      console.error('Error handling button interaction:', err);
    }
}