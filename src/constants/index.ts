// Gold Penny production constants.
// EXPO_PUBLIC_BACKEND is required for gameplay API requests.
// Wallet connection values are only required for optional external-wallet actions.
export const BACKEND = process.env.EXPO_PUBLIC_BACKEND ?? '';
// Build timestamp to help verify OTA updates and bust caches.
export const BUILD_TS = '2025-10-04T00:00:00Z';

// External wallet connection config.
export const CHAIN_ID = 11155111; // Sepolia
export const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL ?? '';
export const WC_PROJECT_ID = process.env.EXPO_PUBLIC_WC_PROJECT_ID ?? '';
export const WC_METADATA = {
  name: 'Gold Penny',
  description: 'Gold Penny daily strategy game by Penny Float.',
  url: 'https://goldpenny.pennyfloat.com',
  icons: ['https://goldpenny.pennyfloat.com/favicon.ico'],
};
