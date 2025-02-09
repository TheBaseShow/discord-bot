require('dotenv').config();
const wallet = require('../lib/onchain/wallet');

async function main() {
  const contestId = '0x' + '1'.repeat(64);
  // const creationTx = await wallet.createContest({
  //   title: "Best Joke 01",
  //   id: contestId,
  //   cid: '0x' + '2'.repeat(64),
  //   currencyToken: '0x' + '0'.repeat(40),
  //   entryFee: 0,
  //   duration: 1
  // });
  // console.log(creationTx);
  const submission = {
    contestId,
    userAddress: '0x2615EccAfdec3D496182b8776B8723ea21B0BBbc',
    content: 'Hello mate',
  };
  console.log(submission);
  const sig = await wallet.checkSubmission(submission);
  console.log({ sig });
}

main();