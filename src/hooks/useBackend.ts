import { BACKEND } from '@/constants';
// Future-only external wallet and legacy reward bridge.
// Active Gold Penny gameplay uses the typed API modules under src/lib/api instead.
import { error } from '@/lib/logger';

let backendOverride: string | null = null;

export function setBackendOverride(url: string | null) {
  backendOverride = url && url.trim().length > 0 ? url.trim() : null;
  // Reset instance so new calls use the new base URL
  backendInstance = null;
}

export function resetBackendCache() {
  backendOverride = null;
  backendInstance = null;
}

function getBaseUrl() {
  return backendOverride || BACKEND;
}

async function fetchJson(path: string, init?: RequestInit) {
  const base = getBaseUrl();
  const url = `${base}${path}`;
  if (__DEV__) {
    console.log('[API] Request', { url, init });
  }
  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-client': 'mobile',
      // Mark manual intent for ad credits to pass server gating
      ...(path.startsWith('/ad/credits') ? { 'x-manual': '1' } : {}),
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  if (__DEV__) {
    console.log('[API] Response', { url, status: res.status, text });
  }
  try {
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
  } catch (e: any) {
    error('API', 'url=', url, 'status=', res.status, 'body=', text);
    throw e;
  }
}

// Create a singleton backend instance to prevent multiple identical objects
let backendInstance: any = null;

export function useBackend() {
  if (!backendInstance) {
    if (__DEV__) {
      console.log('[useBackend] Creating singleton backend instance');
    }
    backendInstance = {
      backendUrl: getBaseUrl(),
      _healthCache: null as any,

  // health
      health: async () => {
        if (backendInstance._healthCache) return backendInstance._healthCache;
        const h = await fetchJson('/health');
        backendInstance._healthCache = h;
        return h;
      },

      // auth
      getNonce: (address: string) =>
        fetchJson(`/auth/nonce?address=${address}`),

      verify: (payload: { address: string; signature: string }) =>
        fetchJson('/auth/verify', { method: 'POST', body: JSON.stringify(payload) }),

      // balances (server-side, optional; client also reads on-chain)
      balances: (address: string) =>
        fetchJson(`/balances?address=${address}`),

      // convenience: refresh helpers for common tokens (call server balances endpoint)
      refreshNnt: (address: string) => fetchJson(`/balances?address=${address}`),
      refreshGnnt: (address: string) => fetchJson(`/balances?address=${address}`),

      // actions you mapped in Flask (adjust paths to match backend.py)
      airdropNnt: (address: string, amount = 500) =>
        fetchJson('/airdrop/nnt', { method: 'POST', body: JSON.stringify({ address, from: address }) }),

      airdropGnnt: (address: string, amount = 500) =>
        fetchJson('/airdrop/gnnt', { method: 'POST', body: JSON.stringify({ address, from: address }) }),

      // Transaction builders - return transaction data for user to sign
      claimTrue: (address: string, postId: number) =>
        fetchJson('/tx/claim/true', { 
          method: 'POST', 
          body: JSON.stringify({ from: address, postId }) 
        }),

      payGap: (address: string, postId: number) =>
        fetchJson('/tx/gap/pay', { 
          method: 'POST', 
          body: JSON.stringify({ from: address, postId }) 
        }),

      // Voting functions
      voteTrueOnPost: (address: string, postId: number) =>
        fetchJson('/tx/vote', {
          method: 'POST',
          body: JSON.stringify({ from: address, postId, sideTrue: true })
        }),

      voteFakeOnPost: (address: string, postId: number) =>
        fetchJson('/tx/vote', {
          method: 'POST', 
          body: JSON.stringify({ from: address, postId, sideTrue: false })
        }),

      // Post viewing
      registerView: (address: string, postId: number) =>
        fetchJson('/tx/view/register', {
          method: 'POST',
          body: JSON.stringify({ from: address, postId })
        }),

      // Post creation
      createPostTx: (address: string, postId: number) =>
        fetchJson('/tx/post/create', {
          method: 'POST',
          body: JSON.stringify({ from: address, postId })
        }),
      
      // ad/watch and posts
      // Backend exposes legacy endpoint POST /ad/view (or /reward/ad) which expects { viewer: address }
      watchAd: (address: string) =>
        fetchJson('/ad/view', { method: 'POST', body: JSON.stringify({ viewer: address }) }),

      // Read ad credits via POST only (avoids unsolicited GET prefetchers)
      // Use compact shape to get exactly {usedToday, remaining, cap}
      adCredits: (address: string) => fetchJson(`/ad/credits`, {
        method: 'POST',
        body: JSON.stringify({ address, shape: 'min' }),
        headers: { 'x-manual': '1', 'x-shape': 'min' },
      }),

      createPost: (payload: { communityId: string; category: string; body: string; address?: string }) =>
        fetchJson('/posts', { method: 'POST', body: JSON.stringify(payload) }),

      // Phase 1: off-chain points APIs
      getPoints: (address: string) => fetchJson(`/points/${address}`),
      getDebt: (address: string) => fetchJson(`/debt/${address}`),
      repayDebt: (address: string, payload: { nnt?: number; gnnt?: number }) =>
        fetchJson(`/debt/repay`, { method: 'POST', body: JSON.stringify({ address, ...payload }) }),
      leaderboard: (token: 'nnt'|'gnnt'='gnnt', limit = 100) =>
        fetchJson(`/points/leaderboard?token=${token}&limit=${limit}`),
      snapshotJson: () => fetchJson('/snapshot/json'),

      // Off-chain actions (Phase 1)
      offchainView: (address: string, postId: number) =>
        fetchJson('/offchain/view', { method: 'POST', body: JSON.stringify({ address, postId }) }),
      offchainVote: (address: string, postId: number, voteCode: number) =>
        fetchJson('/offchain/vote', { method: 'POST', body: JSON.stringify({ address, postId, voteCode }) }),
      offchainCreate: (address: string, postId: number) =>
        fetchJson('/offchain/create', { method: 'POST', body: JSON.stringify({ address, postId }) }),
      isPointsMode: async () => {
        try {
          const h = await backendInstance.health();
          return !!h?.pointsMode;
        } catch {
          return false;
        }
      },
    };
  }
  
  return backendInstance;
}
