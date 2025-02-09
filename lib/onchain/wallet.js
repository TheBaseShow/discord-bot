const {PrivyClient} = require('@privy-io/server-auth');
const TheGameShow = require('../../abi/the-game-show.abi.json');
const { encodeFunctionData, createWalletClient, keccak256, encodePacked } = require('viem')
const {base} = require('viem/chains');
const {base58_to_binary} = require('base58-js');

const privy = new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);

const createContestCalldata = ({ title, id, cid, currencyToken, entryFee, duration }) => {
    return encodeFunctionData({
        abi: TheGameShow,
        functionName: 'createContest',
        args: [title, id, cid, currencyToken, entryFee, duration]
    });
}
const getWalletClient = async () => {
    const account = await createViemAccount({
        walletId: process.env.PRIVY_WALLET_ID,
        address: process.env.WALLET_ADDRESS,
        privy
    });
    return createWalletClient({
        account,
        chain: base,
        transport: http(),
    });
};

const createContest = async ({ title, id, cid, currencyToken, entryFee, duration }) => {
    const client = await getWalletClient();
    return client.sentTransaction({
        to: process.env.CONTRACT_ADDRESS,
        data: createContestCalldata({ title, id, cid, currencyToken, entryFee, duration }),
    });
}

const checkSubmission = async ({ guildId, contestId, userId, content }) => {
    const ipfsUpload = await fetch('https://api.ipfs.tf/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.IPFS_API_KEY,
        },
        body: JSON.stringify({
            data: content
        })
    }).then(r => r.json());
    const contestId = keccak256(encodePacked(['uint256', 'uint256'], [guildId, contestId]));
    const cid = ipfsUpload.docUrl.split('/').pop();
    const bytes = base58_to_binary(cid);
    const bidBytes32 = Buffer.from(bytes.slice(2)).toString('hex');
    const client = await getWalletClient();
    const message = keccak256(encodePacked(
        ['bytes32', 'address', 'bytes32'],
        [contestId, userId, '0x' + bidBytes32]
    ))
    return client.signMessage({
        message: `${contestId}${userId}${bidBytes32}`
    });
}

module.exports = {
    getWalletClient,
    createContest,
    checkSubmission,
}