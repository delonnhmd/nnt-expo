export const CHAIN_ID = 11155111; // Sepolia
export const BACKEND = process.env.EXPO_PUBLIC_BACKEND ?? '';
export const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL ?? '';
export const WC_PROJECT_ID = process.env.EXPO_PUBLIC_WC_PROJECT_ID ?? '';
// Build timestamp to help verify OTA updates and bust caches
export const BUILD_TS = '2025-10-04T00:00:00Z';

export const NNT_ADDRESS  = '0xa82B7BC1a801D3819F48dE386255484660FD1bC2';
export const GNNT_ADDRESS = '0x76A8E665683AC87E449Fa919F8263F6a6e8892c9';

export const NNT_DECIMALS = 18;
export const GNNT_DECIMALS = 18;

//export const WC_PROJECT_ID = process.env.EXPO_PUBLIC_WC_PROJECT_ID || '';
export const WC_METADATA = {
  name: 'NNT/GNNT — Sepolia Test Hub',
  description: 'NNT mobile client',
  url: 'https://nntpress.com',
  icons: ['https://walletconnect.com/_next/static/media/walletconnect-logo.9c2a3e16.svg'],
};
