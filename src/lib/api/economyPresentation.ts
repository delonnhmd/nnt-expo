import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  BusinessMarginsResponse,
  CommutePressureResponse,
  EconomyPresentationSummaryResponse,
  FutureOpportunityTeasersResponse,
  MarketOverviewResponse,
  PlayerEconomyExplainerResponse,
  PriceTrendsResponse,
} from '@/types/economyPresentation';

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

async function fetchWithFallback<T>(paths: string[]): Promise<T> {
  const errors: string[] = [];
  for (const path of paths) {
    try {
      return await fetchJsonPath<T>(path);
    } catch (error: unknown) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(errors.join(' | '));
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

export async function getMarketOverview(
  playerId: string,
  asOfDate?: string | null,
): Promise<MarketOverviewResponse> {
  return fetchWithFallback<MarketOverviewResponse>([
    withDateParam(`/economy-presentation/player/${playerId}/market-overview`, asOfDate),
  ]);
}

export async function getPriceTrends(
  playerId: string,
  asOfDate?: string | null,
): Promise<PriceTrendsResponse> {
  return fetchWithFallback<PriceTrendsResponse>([
    withDateParam(`/economy-presentation/player/${playerId}/price-trends`, asOfDate),
  ]);
}

export async function getBusinessMargins(
  playerId: string,
  asOfDate?: string | null,
): Promise<BusinessMarginsResponse> {
  return fetchWithFallback<BusinessMarginsResponse>([
    withDateParam(`/economy-presentation/player/${playerId}/business-margins`, asOfDate),
  ]);
}

export async function getCommutePressure(
  playerId: string,
  asOfDate?: string | null,
): Promise<CommutePressureResponse> {
  return fetchWithFallback<CommutePressureResponse>([
    withDateParam(`/economy-presentation/player/${playerId}/commute-pressure`, asOfDate),
  ]);
}

export async function getEconomyExplainer(
  playerId: string,
  asOfDate?: string | null,
): Promise<PlayerEconomyExplainerResponse> {
  return fetchWithFallback<PlayerEconomyExplainerResponse>([
    withDateParam(`/economy-presentation/player/${playerId}/explainer`, asOfDate),
  ]);
}

export async function getFutureTeasers(
  playerId: string,
  asOfDate?: string | null,
): Promise<FutureOpportunityTeasersResponse> {
  return fetchWithFallback<FutureOpportunityTeasersResponse>([
    withDateParam(`/economy-presentation/player/${playerId}/future-teasers`, asOfDate),
  ]);
}

export async function getEconomyPresentationSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<EconomyPresentationSummaryResponse> {
  return fetchWithFallback<EconomyPresentationSummaryResponse>([
    withDateParam(`/economy-presentation/player/${playerId}/summary`, asOfDate),
  ]);
}
