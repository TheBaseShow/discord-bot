const {base58_to_binary, binary_to_base58} = require('base58-js');

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')          // Replace spaces with -
    .replace(/[^\w\-]+/g, '')      // Remove all non-word chars
    .replace(/-+/g, '-');       // Replace multiple - with single -
}

function cidToBytes32(cid) {
  const bytes = base58_to_binary(cid);
  const bidBytes32 = Buffer.from(bytes.slice(2));
  return `0x${bidBytes32.toString('hex')}`
}

function bytes32ToCid(bytes32) {
  if (bytes32.startsWith('0x')) {
    bytes32 = bytes32.slice(2);
  }
  const bytes = Buffer.concat([Buffer.from('1220', 'hex'), Buffer.from(bytes32, 'hex')]);
  return binary_to_base58(bytes);
}

module.exports = {
  slugify,
  cidToBytes32,
  bytes32ToCid,
}