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
  adminMetrics(): Promise<{ users: number; today_rows: number; today_ad_nnt: string; today_votes: number }>;
  register(username?: string, address?: string): Promise<any>;
  getMyProfile(): Promise<{ ok: boolean; profile?: { username: string; address: string; created_at: number } }>;
  createPost(body: { topicId?: string; category?: string; content: string; author?: string }): Promise<any>;
  rewardsCurrent(): Promise<any>;
  // Airdrop helpers
  airdropClaimable(token: Token, epoch: number, address: string): Promise<any>;
  txAirdropClaim(from: string, token: Token, epoch: number, address: string): Promise<any>;
  // Admin actions
  adminPostHide(postId: string | number): Promise<any>;
  adminPostUnhide(postId: string | number): Promise<any>;
  adminUserLockAddress(address: string): Promise<any>;
  adminUserUnlockAddress(address: string): Promise<any>;
  adminUserResetCaps(uid: string): Promise<any>;
  adminUsers(query?: string, limit?: number): Promise<Array<{ address: string; postsCount: number; votesCount: number; locked: boolean; isAdmin: boolean; nnt: number; gnnt: number }>>;

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

async function getBaseUrl(): Promise<string> {
  try {
    const override = await AsyncStorage.getItem('backend:override');
    if (override && /^https?:\/\//i.test(override)) return override.replace(/\/$/, '');
  } catch {}
  return BACKEND?.replace(/\/$/, '') || '';
}

async function fetchJson(path: string, init?: RequestInit) {
  const base = await getBaseUrl();
  const url = `${base}${path}`;
  console.log(`[API] Fetching: ${url}`);
  
  const idHeaders = await getIdentityHeaders();
  // Optional admin token for privileged endpoints
  let adminToken: string | null = null;
  try { adminToken = await AsyncStorage.getItem('admin:token'); } catch {}
  
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...idHeaders,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        ...(init?.headers || {}),
      },
    } as any);
    
    const text = await res.text();
    console.log(`[API] Response status: ${res.status}, text length: ${text?.length || 0}`);
    
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      // Non-JSON response (e.g., HTML from a proxy). Surface details for easier debugging
      const snippet = (text || '').slice(0, 200);
      console.error(`[API] Non-JSON response: ${snippet}`);
      throw new Error(`Non-JSON response (status ${res.status}): ${snippet}`);
    }
    if (!res.ok) {
      console.error(`[API] Error response:`, json);
      throw new Error(json?.error || `HTTP ${res.status}`);
    }
    return json;
  } catch (e: any) {
    console.error(`[API] Fetch error for ${path}:`, e);
    throw e;
  }
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
  adminMetrics() { return fetchJson('/admin/metrics'); },
  register(username?: string, address?: string) { 
    if (username && address) {
      return fetchJson('/register', { method: 'POST', body: JSON.stringify({ username, address }) });
    }
    return fetchJson('/register', { method: 'POST', body: '{}' });
  },
  getMyProfile() { return fetchJson('/me/profile'); },
  createPost(body) { return fetchJson('/posts', { method: 'POST', body: JSON.stringify(body) }); },
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
    rewardsCurrent() { return fetchJson('/rewards/current'); },
    airdropClaimable(token: Token, epoch: number, address: string) {
      const q = `?token=${encodeURIComponent(token)}&epoch=${encodeURIComponent(String(epoch))}&address=${encodeURIComponent(address)}`;
      return fetchJson(`/airdrop/claimable${q}`);
    },
    txAirdropClaim(from: string, token: Token, epoch: number, address: string) {
      return fetchJson('/tx/airdrop/claim', { method: 'POST', body: JSON.stringify({ from, token, epoch, address }) });
    },
    // Admin actions (require admin token in AsyncStorage as 'admin:token')
    adminPostHide(postId: string | number) { return fetchJson(`/admin/post/${postId}/hide`, { method: 'POST', body: '{}' }); },
    adminPostUnhide(postId: string | number) {
      // Prefer role-protected endpoint; if backend also supports address-based unhide, it's fine to use this.
      return fetchJson(`/admin/post/${postId}/unhide`, { method: 'POST', body: '{}' });
    },
    async adminUserLockAddress(address: string) {
      // Address-based admin endpoints expect admin_address in body
      let adminAddr: string | null = null;
      try { adminAddr = await AsyncStorage.getItem('admin:address'); } catch {}
      if (!adminAddr) throw new Error('Set admin address in Settings');
      return fetchJson('/admin/user/lock', { method: 'POST', body: JSON.stringify({ admin_address: adminAddr, target_address: address }) });
    },
    async adminUserUnlockAddress(address: string) {
      let adminAddr: string | null = null;
      try { adminAddr = await AsyncStorage.getItem('admin:address'); } catch {}
      if (!adminAddr) throw new Error('Set admin address in Settings');
      return fetchJson('/admin/user/unlock', { method: 'POST', body: JSON.stringify({ admin_address: adminAddr, target_address: address }) });
    },
    adminUserResetCaps(uid: string) { return fetchJson(`/admin/user/${encodeURIComponent(uid)}/reset-caps`, { method: 'POST', body: '{}' }); },
    adminUsers(query?: string, limit = 100) {
      const q = query ? `?q=${encodeURIComponent(query)}&limit=${limit}` : `?limit=${limit}`;
      return fetchJson(`/admin/users${q}`);
    },
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
    adminMetrics: async () => ({ users: 0, today_rows: 0, today_ad_nnt: '0', today_votes: 0 }),
    register: async () => ({ ok: true, early: { eligible: true } }),
    createPost: async (body) => ({ ok: true, id: Math.floor(Math.random() * 1e6), ...body }),
    rewardsCurrent: async () => ({ ok: true, ad: { viewRewardGNNT: 1, poolCutBps: 0 }, legacyAdPool: { treasury: '0x0' } }),
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
    // Admin mocks
    adminPostHide: async () => ({ ok: true }),
    adminPostUnhide: async () => ({ ok: true }),
    adminUserLockAddress: async () => ({ ok: true }),
    adminUserUnlockAddress: async () => ({ ok: true }),
    adminUserResetCaps: async () => ({ ok: true }),
    adminUsers: async () => ([
      { address: '0xAdmin', postsCount: 3, votesCount: 12, locked: false, isAdmin: true, nnt: 100, gnnt: 50 },
      { address: '0xUser1', postsCount: 1, votesCount: 2, locked: false, isAdmin: false, nnt: 10, gnnt: 5 },
    ] as any),
    // Airdrop mocks
    airdropClaimable: async (_token: Token, epoch: number, address: string) => ({ ok: true, distributor: '0xDistributor', epoch, index: 0, amount: '0', proof: [], isClaimed: false, address }),
    txAirdropClaim: async () => ({ ok: true, to: '0xDistributor', data: '0x', value: 0, chainId: 11155111 }),
    getMyProfile: async () => ({ ok: true, profile: { username: 'mock', address: '0xMock', created_at: Date.now() / 1000 } }),
  };
}

export async function getApi(): Promise<ApiClient> {
  if (instance) return instance;
  const stored = await getStoredMode();
  const effectiveMode = stored ?? mode;
  instance = effectiveMode === 'real' ? createRealClient() : createMockClient();
  return instance;
}
