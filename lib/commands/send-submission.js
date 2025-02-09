const { getLatestSubmission, addSubmission, getUserWallet} = require('../db');
const {checkSubmission} = require('../onchain/wallet');

module.exports = async (client, message) => {
  const { content } = message;
  const contestId = '0x' + BigInt(message.channel.id).toString(16).padStart(64, '0');
  const userAddress = await getUserWallet(message.author.id);
  const { submissionHash, signature } = await checkSubmission({ contestId, userAddress, content});
  await message.delete().catch(console.error);
  try {
    await addSubmission(message.channel.id, message.author.id, message.content);

    const latestContent = await getLatestSubmission(message.channel.id);
    const newContent = [
      'Your current submission is:',
      '```',
      latestContent,
      '```',
      '',
      `**Submission ID:** ${submissionHash}`,
      `**Signature:** ${signature}`,
    ].join('\n');

    const messagesFetched = await message.channel.messages.fetch({ limit: 10 });
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
  } catch (err) {
    console.error('Error handling submission:', err);
  }
}