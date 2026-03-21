import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  PersonalLifeEventResponse,
  PersonalRiskStateResponse,
  PersonalShockProfileResponse,
  PersonalShockSummaryResponse,
  PersonalShockSystemSummaryResponse,
  PlayerResilienceSummaryResponse,
  RecoveryStateResponse,
} from '@/types/personalShocks';

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

export async function getPersonalShockProfile(
  playerId: string,
  asOfDate?: string | null,
): Promise<PersonalShockProfileResponse> {
  return fetchJsonPath<PersonalShockProfileResponse>(
    withDate(`/personal/player/${playerId}/shock-profile`, asOfDate),
  );
}

export async function getPersonalRiskState(
  playerId: string,
  asOfDate?: string | null,
): Promise<PersonalRiskStateResponse> {
  return fetchJsonPath<PersonalRiskStateResponse>(
    withDate(`/personal/player/${playerId}/risk-state`, asOfDate),
  );
}

export async function getRecentPersonalEvent(
  playerId: string,
  asOfDate?: string | null,
): Promise<PersonalLifeEventResponse> {
  return fetchJsonPath<PersonalLifeEventResponse>(
    withDate(`/personal/player/${playerId}/recent-event`, asOfDate),
  );
}

export async function getPersonalRecoveryState(playerId: string): Promise<RecoveryStateResponse> {
  return fetchJsonPath<RecoveryStateResponse>(`/personal/player/${playerId}/recovery-state`);
}

export async function getPersonalResilienceSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<PlayerResilienceSummaryResponse> {
  return fetchJsonPath<PlayerResilienceSummaryResponse>(
    withDate(`/personal/player/${playerId}/resilience-summary`, asOfDate),
  );
}

export async function getPersonalShockSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<PersonalShockSummaryResponse> {
  return fetchJsonPath<PersonalShockSummaryResponse>(
    withDate(`/personal/player/${playerId}/shock-summary`, asOfDate),
  );
}

export async function getPersonalShockSystemSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<PersonalShockSystemSummaryResponse> {
  return fetchJsonPath<PersonalShockSystemSummaryResponse>(
    withDate(`/personal/player/${playerId}/summary`, asOfDate),
  );
}

