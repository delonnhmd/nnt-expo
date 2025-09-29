import { BACKEND } from '@/constants';
import { error } from '@/lib/logger';

async function fetchJson(path: string, init?: RequestInit) {
  const url = `${BACKEND}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-client': 'mobile',
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json;
  } catch (e: any) {
    error('API', 'url=', url, 'status=', res.status, 'body=', text);
    throw e;
  }
}

export function useBackend() {
  return {
    backendUrl: BACKEND,

    // health
    health: () => fetchJson('/health'),

    // auth
    getNonce: (address: string) =>
      fetchJson(`/auth/nonce?address=${address}`),

    verify: (payload: { address: string; signature: string }) =>
      fetchJson('/auth/verify', { method: 'POST', body: JSON.stringify(payload) }),

    // balances (server-side, optional; client also reads on-chain)
    balances: (address: string) =>
      fetchJson(`/balances?address=${address}`),

    // actions you mapped in Flask (adjust paths to match backend.py)
    airdropNnt: (address: string, key = 100) =>
      fetchJson('/airdrop/nnt', { method: 'POST', body: JSON.stringify({ address, key }) }),

    airdropGnnt: (address: string, key = 200) =>
      fetchJson('/airdrop/gnnt', { method: 'POST', body: JSON.stringify({ address, key }) }),

    claimTrue: (address: string) =>
      fetchJson('/claim/true', { method: 'POST', body: JSON.stringify({ address }) }),

    payGap: (address: string) =>
      fetchJson('/pay/gap', { method: 'POST', body: JSON.stringify({ address }) }),
  };
}
