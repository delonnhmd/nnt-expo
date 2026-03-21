import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  LocalCompetitionStateResponse,
  LocalOpportunityPressureResponse,
  PopulationPressureSummaryResponse,
  PopulationResponseSummaryResponse,
  RegionHeatSummaryResponse,
  RegionPopulationStateResponse,
} from '@/types/populationPressure';

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

export async function getRegionPopulationState(
  playerId: string,
  asOfDate?: string | null,
): Promise<RegionPopulationStateResponse> {
  return fetchJsonPath<RegionPopulationStateResponse>(
    withDateParam(`/population/player/${playerId}/region-state`, asOfDate),
  );
}

export async function getOpportunityPressure(
  playerId: string,
  asOfDate?: string | null,
): Promise<LocalOpportunityPressureResponse> {
  return fetchJsonPath<LocalOpportunityPressureResponse>(
    withDateParam(`/population/player/${playerId}/opportunity-pressure`, asOfDate),
  );
}

export async function getCompetitionState(
  playerId: string,
  asOfDate?: string | null,
): Promise<LocalCompetitionStateResponse> {
  return fetchJsonPath<LocalCompetitionStateResponse>(
    withDateParam(`/population/player/${playerId}/competition-state`, asOfDate),
  );
}

export async function getRegionHeat(
  playerId: string,
  asOfDate?: string | null,
): Promise<RegionHeatSummaryResponse> {
  return fetchJsonPath<RegionHeatSummaryResponse>(
    withDateParam(`/population/player/${playerId}/region-heat`, asOfDate),
  );
}

export async function getPopulationResponseSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<PopulationResponseSummaryResponse> {
  return fetchJsonPath<PopulationResponseSummaryResponse>(
    withDateParam(`/population/player/${playerId}/response-summary`, asOfDate),
  );
}

export async function getPopulationPressureSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<PopulationPressureSummaryResponse> {
  return fetchJsonPath<PopulationPressureSummaryResponse>(
    withDateParam(`/population/player/${playerId}/summary`, asOfDate),
  );
}

export async function refreshPopulationPressure(
  playerId: string,
  asOfDate?: string | null,
): Promise<RegionPopulationStateResponse> {
  return fetchJsonPath<RegionPopulationStateResponse>(
    withDateParam(`/population/player/${playerId}/refresh`, asOfDate),
    'POST',
  );
}
