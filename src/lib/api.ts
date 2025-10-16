import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND } from '@/constants';

export type Token = 'nnt' | 'gnnt';

export interface Points {
  nnt: number;
  gnnt: number;
}

export interface AdCredits {
  usedToday: number;
  remaining: number;
  cap: number;
}

export interface ApiClient {
  health(): Promise<any>;
  getPoints(address: string): Promise<Points>;
  adCredits(address: string): Promise<AdCredits>;
  leaderboard(token?: Token, limit?: number): Promise<Array<{ address: string; nnt?: number; gnnt?: number }>>;
  // New identity-based endpoints
  meBalance(): Promise<{ nnt: number; gnnt: number; ads: { used: number; cap: number } }>;
  getDebt(address: string): Promise<{ outstanding: number; pendingReceivables?: { total: number } }>;

  getFeed(): Promise<any[]>;
  vote(postId: string | number, sideTrue: boolean): Promise<any>;
  adComplete(): Promise<any>;
  referralLink(): Promise<{ link: string }>;
  searchSite(query: string): Promise<any[]>;
  searchUserPosts(address: string, query: string): Promise<any[]>;

}

let mode: 'real' | 'mock' = 'real'; // default to real; can be toggled via setApiMode
let instance: ApiClient | null = null;

export async function setApiMode(next: 'real' | 'mock') {
  mode = next;
  instance = null;
  try { await AsyncStorage.setItem('api:mode', next); } catch {}
}

async function getStoredMode() {
  try {
    const v = await AsyncStorage.getItem('api:mode');
    if (v === 'real' || v === 'mock') return v;
  } catch {}
  return null;
}

async function getIdentityHeaders() {
  // Persist a stable UID per device/session
  let uid = await AsyncStorage.getItem('identity:uid');
  if (!uid) {
    try {
      // fallback to random if crypto unavailable in RN
      uid = `uid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    } catch {
      uid = `uid_${Date.now()}`;
    }
    try { await AsyncStorage.setItem('identity:uid', uid); } catch {}
  }
  // Build a coarse device fingerprint
  const ua = typeof navigator !== 'undefined' && (navigator as any).userAgent ? (navigator as any).userAgent : 'rn';
  // deviceMemory not available in RN; use simple heuristic
  const dm = (typeof (global as any)?.performance !== 'undefined' && (global as any)?.performance?.memory?.jsHeapSizeLimit)
    ? String((global as any).performance.memory.jsHeapSizeLimit)
    : 'na';
  const fp = `${ua}|${dm}`;
  return {
    'X-UID': uid,
    'X-Device-FP': fp,
  } as Record<string, string>;
}

async function fetchJson(path: string, init?: RequestInit) {
  const url = `${BACKEND}${path}`;
  const idHeaders = await getIdentityHeaders();
  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...idHeaders,
      ...(init?.headers || {}),
    },
  } as any);
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json;
}

function createRealClient(): ApiClient {
  return {
    health: () => fetchJson('/health'),
    async getPoints(address: string) {
      const r = await fetchJson(`/points/${address}`);
      // normalize keys
      return {
        nnt: r?.nnt ?? r?.nntPoints ?? 0,
        gnnt: r?.gnnt ?? r?.gnntPoints ?? 0,
      };
    },
    async adCredits(address: string) {
      const r = await fetchJson('/ad/credits', { method: 'POST', body: JSON.stringify({ address, shape: 'min' }) });
      return {
        usedToday: r?.usedToday ?? 0,
        remaining: r?.remaining ?? 0,
        cap: r?.cap ?? 10,
      };
    },
    leaderboard(token: Token = 'gnnt', limit = 50) {
      return fetchJson(`/points/leaderboard?token=${token}&limit=${limit}`);
    },
  // New endpoints
    meBalance() { return fetchJson('/me/balance'); },
  getDebt(address: string) { return fetchJson(`/debt/${address}`); },
  getFeed() { return fetchJson('/posts/feed'); },
  searchSite(query: string) { return fetchJson(`/search?q=${encodeURIComponent(query)}`); },
  searchUserPosts(address: string, query: string) { return fetchJson(`/posts/search?address=${encodeURIComponent(address)}&q=${encodeURIComponent(query)}`); },
    vote(postId: string | number, sideTrue: boolean) {
      return fetchJson('/vote', { method: 'POST', body: JSON.stringify({ postId: String(postId), sideTrue }) });
    },
    adComplete() {
      // dev path uses empty JSON body; server may enforce HMAC in prod
      return fetchJson('/ad/complete', { method: 'POST', body: '{}' });
    },
    referralLink() { return fetchJson('/ref/link'); },
  };
}

function createMockClient(): ApiClient {
  return {
    async health() { return { ok: true, pointsMode: true, mock: true }; },
    async getPoints(address: string) {
      // deterministic mock based on address
      const seed = address ? parseInt(address.slice(2, 6), 16) : 1;
      return {
        nnt: (seed % 1000) + 100,
        gnnt: (seed % 500) + 50,
      };
    },
    async adCredits() { return { usedToday: 2, remaining: 8, cap: 10 }; },
    async leaderboard(token: Token = 'gnnt', limit = 50) {
      const out = Array.from({ length: limit }, (_, i) => ({
        address: `0xMOCK${(i + 1).toString().padStart(3, '0')}`,
        [token]: (limit - i) * 10,
      }));
      return out as any;
    },
  meBalance: async () => ({ nnt: 0, gnnt: 0, ads: { used: 0, cap: 10 } }),
  getDebt: async () => ({ outstanding: 0, pendingReceivables: { total: 0 } }),
    getFeed: async () => ([{ id: 'p1', title: 'Post A', gap: 12 }, { id: 'p2', title: 'Post B', gap: -4 }]),
    vote: async () => ({ ok: true, points: { gnnt: 2 }, left: 49 }),
    adComplete: async () => ({ ok: true, points: { gnnt: 1 }, ads: { used: 1, cap: 10 } }),
    referralLink: async () => ({ link: 'https://nnt.app/invite?ref=mock' }),
    searchSite: async (query: string) => {
      const base = [{ id: 'p1', title: 'Post A', content: 'Alpha news' }, { id: 'p2', title: 'Post B', content: 'Beta news' }];
      const q = (query || '').toLowerCase();
      return !q ? base : base.filter((p) => JSON.stringify(p).toLowerCase().includes(q));
    },
    searchUserPosts: async (address: string, query: string) => {
      const list = [{ id: 'u1', author: address, title: 'My First Post' }, { id: 'u2', author: address, title: 'Another Post' }];
      const q = (query || '').toLowerCase();
      return !q ? list : list.filter((p) => JSON.stringify(p).toLowerCase().includes(q));
    },
  };
}

export async function getApi(): Promise<ApiClient> {
  if (instance) return instance;
  const stored = await getStoredMode();
  const effectiveMode = stored ?? mode;
  instance = effectiveMode === 'real' ? createRealClient() : createMockClient();
  return instance;
}
