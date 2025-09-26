import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { WC_PROJECT_ID, CHAIN_ID, CHAIN_HEX, RPC_URL } from './config';

// Create a singleton Ethereum EIP-1193 provider for RN
let provider;

export async function getWcProvider() {
  if (provider) return provider;

  provider = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    showQrModal: true, // modal-react-native will render the sheet
    qrModalOptions: { themeMode: 'dark' },
    chains: [CHAIN_ID],
    methods: [
      'eth_sendTransaction',
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
      'eth_signTypedData_v4',
      'wallet_switchEthereumChain',
      'wallet_addEthereumChain'
    ],
    events: ['chainChanged','accountsChanged','disconnect','connect'],
    rpcMap: { [CHAIN_ID]: RPC_URL }
  });

  // Ensure Sepolia
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_HEX }]
    });
  } catch (_) {
    // add then switch
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: CHAIN_HEX,
        chainName: 'Sepolia',
        nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: [RPC_URL],
        blockExplorerUrls: ['https://sepolia.etherscan.io']
      }]
    });
  }
  return provider;
}
