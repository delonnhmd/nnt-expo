export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

export const AIRDROP_ABI = [
  "function merkleRoot(uint256 epoch) view returns (bytes32)",
  "function isClaimed(uint256 epoch, uint256 index) view returns (bool)",
  "function claim(uint256 epoch, uint256 index, address account, uint256 amount, bytes32[] proof)"
];

// adjust to your reward contract’s selectors you already used
export const REWARD_ABI = [
  "function createPostByAuthor(uint256 postId)",
  "function vote(uint256 postId, bool sideTrue)",
  "function registerView(uint256 postId)",
  "function claimTrueVoterGNNT(uint256 postId)",
  "function payGapFee(uint256 postId)"
];
