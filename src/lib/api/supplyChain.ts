// Step 43 — Supply Chain Graph + Bottleneck Opportunity Engine API client

import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  BasketSupplyMultiplierResponse,
  JobPressureResponse,
  SupplyChainBottleneckResponse,
  SupplyChainNodeStateResponse,
  SupplyChainStoryResponse,
  SupplyChainSummaryResponse,
} from '@/types/supplyChain';

async function getBaseUrl(): Promise<string> {
  try {
    const override = await AsyncStorage.getItem('backend:override');
    if (override && /^https?:\/\//i.test(override)) {
      return override.replace(/\/$/, '');
    }
  } catch {
    // fall through to static config
  }
  return (BACKEND || '').replace(/\/$/, '');
}

async function getIdentityHeaders(): Promise<Record<string, string>> {
  let uid = '';
  try {
    uid = (await AsyncStorage.getItem('identity:uid')) || '';
  } catch {
    uid = '';
  }

  if (!uid) {
    uid = `uid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    try {
      await AsyncStorage.setItem('identity:uid', uid);
    } catch {
      // no-op
    }
  }

  const ua =
    typeof navigator !== 'undefined' && (navigator as any)?.userAgent
      ? String((navigator as any).userAgent)
      : 'expo';

  return {
    'X-UID': uid,
    'X-Device-FP': ua,
  };
}

async function fetchJsonPath<T>(path: string): Promise<T> {
  const base = await getBaseUrl();
  if (!base) {
    throw new Error('Backend URL is not configured. Set EXPO_PUBLIC_BACKEND or backend override.');
  }
  const headers = await getIdentityHeaders();
  const resp = await fetch(`${base}${path}`, { headers });
  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`Supply Chain API error ${resp.status}: ${text}`);
  }
  return resp.json() as Promise<T>;
}

async function postJsonPath<T>(path: string): Promise<T> {
  const base = await getBaseUrl();
  if (!base) {
    throw new Error('Backend URL is not configured. Set EXPO_PUBLIC_BACKEND or backend override.');
  }
  const headers = await getIdentityHeaders();
  const resp = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`Supply Chain API error ${resp.status}: ${text}`);
  }
  return resp.json() as Promise<T>;
}

function regionParam(region?: string): string {
  return region ? `?region=${encodeURIComponent(region)}` : '';
}

// ---------------------------------------------------------------------------
// 1. Physical node availability states
// ---------------------------------------------------------------------------

export async function getSupplyChainNodes(
  day: number,
  region?: string,
): Promise<SupplyChainNodeStateResponse[]> {
  return fetchJsonPath(`/supply-chain/day/${day}/nodes${regionParam(region)}`);
}

// ---------------------------------------------------------------------------
// 2. Bottleneck detection
// ---------------------------------------------------------------------------

export async function getSupplyChainBottlenecks(
  day: number,
  region?: string,
  threshold: number = 0.95,
): Promise<SupplyChainBottleneckResponse[]> {
  const params = new URLSearchParams();
  if (region) params.set('region', region);
  params.set('threshold', String(threshold));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return fetchJsonPath(`/supply-chain/day/${day}/bottlenecks${qs}`);
}

// ---------------------------------------------------------------------------
// 3. Basket supply cost multipliers
// ---------------------------------------------------------------------------

export async function getBasketSupplyMultipliers(
  day: number,
  region?: string,
): Promise<BasketSupplyMultiplierResponse[]> {
  return fetchJsonPath(`/supply-chain/day/${day}/basket-multipliers${regionParam(region)}`);
}

// ---------------------------------------------------------------------------
// 4. Job pressure from bottlenecks
// ---------------------------------------------------------------------------

export async function getJobPressureFromBottlenecks(
  day: number,
  region?: string,
): Promise<JobPressureResponse[]> {
  return fetchJsonPath(`/supply-chain/day/${day}/job-pressure${regionParam(region)}`);
}

// ---------------------------------------------------------------------------
// 5. Full daily supply chain summary
// ---------------------------------------------------------------------------

export async function getSupplyChainSummary(
  day: number,
  region?: string,
): Promise<SupplyChainSummaryResponse> {
  return fetchJsonPath(`/supply-chain/day/${day}/summary${regionParam(region)}`);
}

// ---------------------------------------------------------------------------
// 6. Narrative story summary
// ---------------------------------------------------------------------------

export async function getSupplyChainStory(
  day: number,
  region?: string,
): Promise<SupplyChainStoryResponse> {
  return fetchJsonPath(`/supply-chain/day/${day}/story${regionParam(region)}`);
}

// ---------------------------------------------------------------------------
// 7. Compute + persist daily snapshot (admin / day-progression use)
// ---------------------------------------------------------------------------

export async function computeSupplyChainSnapshot(
  day: number,
  region?: string,
): Promise<SupplyChainSummaryResponse> {
  const qs = regionParam(region);
  return postJsonPath(`/supply-chain/day/${day}/compute${qs}`);
}
