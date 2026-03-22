// Gold Penny / PFT active constants
export const BACKEND = process.env.EXPO_PUBLIC_BACKEND ?? '';
// Build timestamp to help verify OTA updates and bust caches
export const BUILD_TS = '2025-10-04T00:00:00Z';

// WalletConnect / Ethereum config (still used by useWallet.tsx for wallet-based auth signing)
export const CHAIN_ID = 11155111; // Sepolia
export const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL ?? '';
export const WC_PROJECT_ID = process.env.EXPO_PUBLIC_WC_PROJECT_ID ?? '';
export const WC_METADATA = {
  name: 'Gold Penny',
  description: 'Gold Penny mobile client',
  url: 'https://goldpenny.pennyfloat.com',
  icons: ['https://walletconnect.com/_next/static/media/walletconnect-logo.9c2a3e16.svg'],
};

// ─── ARCHIVED (NNT/GNNT token addresses — see archive/nnt-legacy/) ────────────
// NNT_ADDRESS, GNNT_ADDRESS, NNT_DECIMALS, GNNT_DECIMALS were removed as part
// of Step 43.5 cleanup. Only the WalletConnect infrastructure above is retained.
// ─────────────────────────────────────────────────────────────────────────────
