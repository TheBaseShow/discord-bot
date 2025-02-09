const {PrivyClient} = require('@privy-io/server-auth');
const TheGameShow = require('../abi/the-game-show.abi.json');
const { encodeFunctionData, createWalletClient, keccak256, encodePacked, http} = require('viem')
const {baseSepolia} = require('viem/chains');
const {createViemAccount} = require('@privy-io/server-auth/viem');
const {cidToBytes32} = require('../utils');

const privy = new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET, {
    walletApi: {
        authorizationPrivateKey: process.env.PRIVY_AUTH_KEY
    }
});

const createContestCalldata = ({ title, id, cid, currencyToken, entryFee, duration }) => {
    console.log({ title, id, cid, currencyToken, entryFee, duration });
    return encodeFunctionData({
        abi: TheGameShow,
        functionName: 'createContest',
        args: [title, id, cid, currencyToken, entryFee, duration]
    });
}
const getWalletClient = () => {
    return createViemAccount({
        walletId: process.env.PRIVY_WALLET_ID,
        address: process.env.WALLET_ADDRESS,
        privy
    }).then(account => createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(),
    }));
};

const createContest = async ({ title, id, cid, currencyToken, entryFee, duration }) => {
    const client = await getWalletClient();
    return client.sendTransaction({
        to: process.env.CONTRACT_ADDRESS,
        data: createContestCalldata({ title, id, cid, currencyToken, entryFee, duration }),
    });
}

const checkSubmission = async ({ contestId, userAddress, content }) => {
    const ipfsUpload = await fetch('https://api.ipfs.tf/document', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.IPFS_API_KEY,
        },
        body: JSON.stringify({
            data: content
        })
    }).then(r => r.json());
    const cid = ipfsUpload.docUrl.split('/').pop();
    const cidBytes32 = cidToBytes32(cid);
    const client = await getWalletClient();
    const hash = keccak256(encodePacked(
      ['bytes32', 'address', 'bytes32'],
      [contestId, userAddress, cidBytes32]
    ));
    const message = { raw: keccak256(encodePacked(
      ['bytes32', 'address', 'bytes32'],
      [contestId, userAddress, cidBytes32]
    )) };
    const signature = await client.signMessage({ message });
    return {
        submissionHash: cidBytes32,
        signature,
    };
}

module.exports = {
    getWalletClient,
    createContest,
    checkSubmission,
}