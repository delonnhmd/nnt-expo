import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  LocalPressureSummaryResponse,
  PlayerPatternSummaryResponse,
  RegionMemorySummaryResponse,
  WorldMemoryHistoryResponse,
  WorldMemorySnapshotResponse,
  WorldMemorySummaryResponse,
  WorldNarrativeResponse,
  WorldPatternsResponse,
} from '@/types/worldMemory';

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

async function fetchJsonPath<T>(path: string, method: 'GET' | 'POST' = 'GET'): Promise<T> {
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
    method,
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

function toResponseDateValue(asOfDate?: string | null): string {
  if (!asOfDate) return '';
  return encodeURIComponent(asOfDate);
}

function withDateParam(path: string, asOfDate?: string | null): string {
  const dateValue = toResponseDateValue(asOfDate);
  if (!dateValue) return path;
  return `${path}?as_of_date=${dateValue}`;
}

export async function getWorldMemorySnapshot(
  playerId: string,
  asOfDate?: string | null,
): Promise<WorldMemorySnapshotResponse> {
  return fetchJsonPath<WorldMemorySnapshotResponse>(
    withDateParam(`/world-memory/player/${playerId}/snapshot`, asOfDate),
  );
}

export async function getWorldMemoryPatterns(
  playerId: string,
  asOfDate?: string | null,
): Promise<WorldPatternsResponse> {
  return fetchJsonPath<WorldPatternsResponse>(
    withDateParam(`/world-memory/player/${playerId}/patterns`, asOfDate),
  );
}

export async function getWorldNarrative(
  playerId: string,
  asOfDate?: string | null,
): Promise<WorldNarrativeResponse> {
  return fetchJsonPath<WorldNarrativeResponse>(
    withDateParam(`/world-memory/player/${playerId}/narrative`, asOfDate),
  );
}

export async function getLocalPressure(
  playerId: string,
  asOfDate?: string | null,
): Promise<LocalPressureSummaryResponse> {
  return fetchJsonPath<LocalPressureSummaryResponse>(
    withDateParam(`/world-memory/player/${playerId}/local-pressure`, asOfDate),
  );
}

export async function getPlayerPatterns(
  playerId: string,
  asOfDate?: string | null,
): Promise<PlayerPatternSummaryResponse> {
  return fetchJsonPath<PlayerPatternSummaryResponse>(
    withDateParam(`/world-memory/player/${playerId}/player-patterns`, asOfDate),
  );
}

export async function getRegionMemory(
  playerId: string,
  asOfDate?: string | null,
): Promise<RegionMemorySummaryResponse> {
  return fetchJsonPath<RegionMemorySummaryResponse>(
    withDateParam(`/world-memory/player/${playerId}/region-memory`, asOfDate),
  );
}

export async function getWorldMemoryHistory(
  playerId: string,
  asOfDate?: string | null,
  limit = 30,
): Promise<WorldMemoryHistoryResponse> {
  const basePath = withDateParam(`/world-memory/player/${playerId}/history`, asOfDate);
  const separator = basePath.includes('?') ? '&' : '?';
  const path = `${basePath}${separator}limit=${Math.max(1, Math.min(200, Number(limit) || 30))}`;
  return fetchJsonPath<WorldMemoryHistoryResponse>(path);
}

export async function getWorldMemorySummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<WorldMemorySummaryResponse> {
  return fetchJsonPath<WorldMemorySummaryResponse>(
    withDateParam(`/world-memory/player/${playerId}/summary`, asOfDate),
  );
}

export async function refreshWorldMemory(
  playerId: string,
  asOfDate?: string | null,
): Promise<WorldMemorySnapshotResponse> {
  return fetchJsonPath<WorldMemorySnapshotResponse>(
    withDateParam(`/world-memory/player/${playerId}/refresh`, asOfDate),
    'POST',
  );
}
