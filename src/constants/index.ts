// Gold Penny production constants.
// EXPO_PUBLIC_BACKEND is required for gameplay API requests.
// WalletConnect values are only required when wallet-based auth/signing is used.
export const BACKEND = process.env.EXPO_PUBLIC_BACKEND ?? '';
// Build timestamp to help verify OTA updates and bust caches.
export const BUILD_TS = '2025-10-04T00:00:00Z';

// WalletConnect / Ethereum config.
export const CHAIN_ID = 11155111; // Sepolia
export const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL ?? '';
export const WC_PROJECT_ID = process.env.EXPO_PUBLIC_WC_PROJECT_ID ?? '';
export const WC_METADATA = {
  name: 'Gold Penny',
  description: 'Gold Penny mobile client',
  url: 'https://goldpenny.pennyfloat.com',
  icons: ['https://walletconnect.com/_next/static/media/walletconnect-logo.9c2a3e16.svg'],
};
