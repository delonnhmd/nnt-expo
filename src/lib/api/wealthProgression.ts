import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  AssetProgressionStateResponse,
  NetWorthSummaryResponse,
  SavingsCapacityStateResponse,
  WealthActionsEvaluationResponse,
  WealthMomentumSummaryResponse,
  WealthProfileResponse,
} from '@/types/wealthProgression';

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
  const identityHeaders = await getIdentityHeaders();

  let adminToken: string | null = null;
  try {
    adminToken = await AsyncStorage.getItem('admin:token');
  } catch {
    adminToken = null;
  }

  const response = await fetch(`${base}${path}`, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      ...identityHeaders,
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    const snippet = (text || '').slice(0, 180);
    throw new Error(`Non-JSON response at ${path}: ${snippet}`);
  }

  if (!response.ok) {
    const detail =
      typeof payload === 'object' && payload && 'detail' in (payload as any)
        ? String((payload as any).detail)
        : `HTTP ${response.status}`;
    throw new Error(`${path}: ${detail}`);
  }

  return payload as T;
}

function withDate(path: string, asOfDate?: string | null): string {
  if (!asOfDate) return path;
  return `${path}?as_of_date=${encodeURIComponent(asOfDate)}`;
}

export async function getWealthProfile(
  playerId: string,
  asOfDate?: string | null,
): Promise<WealthProfileResponse> {
  return fetchJsonPath<WealthProfileResponse>(
    withDate(`/wealth/player/${playerId}/profile`, asOfDate),
  );
}

export async function getSavingsCapacityState(
  playerId: string,
  asOfDate?: string | null,
): Promise<SavingsCapacityStateResponse> {
  return fetchJsonPath<SavingsCapacityStateResponse>(
    withDate(`/wealth/player/${playerId}/savings-capacity`, asOfDate),
  );
}

export async function getAssetProgressionState(
  playerId: string,
  asOfDate?: string | null,
): Promise<AssetProgressionStateResponse> {
  return fetchJsonPath<AssetProgressionStateResponse>(
    withDate(`/wealth/player/${playerId}/asset-progression`, asOfDate),
  );
}

export async function getWealthActionEvaluation(
  playerId: string,
  asOfDate?: string | null,
): Promise<WealthActionsEvaluationResponse> {
  return fetchJsonPath<WealthActionsEvaluationResponse>(
    withDate(`/wealth/player/${playerId}/action-evaluation`, asOfDate),
  );
}

export async function getNetWorthSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<NetWorthSummaryResponse> {
  return fetchJsonPath<NetWorthSummaryResponse>(
    withDate(`/wealth/player/${playerId}/net-worth-summary`, asOfDate),
  );
}

export async function getWealthMomentumSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<WealthMomentumSummaryResponse> {
  return fetchJsonPath<WealthMomentumSummaryResponse>(
    withDate(`/wealth/player/${playerId}/momentum-summary`, asOfDate),
  );
}
