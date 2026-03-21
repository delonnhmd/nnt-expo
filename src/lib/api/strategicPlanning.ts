import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  BusinessPlanResponse,
  DebtVsGrowthResponse,
  FuturePreparationResponse,
  HousingTradeoffResponse,
  RecoveryVsPushResponse,
  ShortHorizonPlansResponse,
  StrategicPlanningSummaryResponse,
  StrategyRecommendationResponse,
} from '@/types/strategicPlanning';

async function getBaseUrl(): Promise<string> {
  try {
    const override = await AsyncStorage.getItem('backend:override');
    if (override && /^https?:\/\//i.test(override)) {
      return override.replace(/\/$/, '');
    }
  } catch {
    // fall back to default backend config
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

export async function getShortHorizonPlans(
  playerId: string,
  asOfDate?: string | null,
): Promise<ShortHorizonPlansResponse> {
  return fetchWithFallback<ShortHorizonPlansResponse>([
    withDateParam(`/strategic-planning/player/${playerId}/plans`, asOfDate),
  ]);
}

export async function getHousingTradeoff(
  playerId: string,
  asOfDate?: string | null,
): Promise<HousingTradeoffResponse> {
  return fetchWithFallback<HousingTradeoffResponse>([
    withDateParam(`/strategic-planning/player/${playerId}/housing-tradeoff`, asOfDate),
  ]);
}

export async function getDebtVsGrowth(
  playerId: string,
  asOfDate?: string | null,
): Promise<DebtVsGrowthResponse> {
  return fetchWithFallback<DebtVsGrowthResponse>([
    withDateParam(`/strategic-planning/player/${playerId}/debt-vs-growth`, asOfDate),
  ]);
}

export async function getBusinessPlan(
  playerId: string,
  asOfDate?: string | null,
): Promise<BusinessPlanResponse> {
  return fetchWithFallback<BusinessPlanResponse>([
    withDateParam(`/strategic-planning/player/${playerId}/business-plan`, asOfDate),
  ]);
}

export async function getRecoveryVsPush(
  playerId: string,
  asOfDate?: string | null,
): Promise<RecoveryVsPushResponse> {
  return fetchWithFallback<RecoveryVsPushResponse>([
    withDateParam(`/strategic-planning/player/${playerId}/recovery-vs-push`, asOfDate),
  ]);
}

export async function getStrategyRecommendation(
  playerId: string,
  asOfDate?: string | null,
): Promise<StrategyRecommendationResponse> {
  return fetchWithFallback<StrategyRecommendationResponse>([
    withDateParam(`/strategic-planning/player/${playerId}/recommendation`, asOfDate),
  ]);
}

export async function getFuturePreparation(
  playerId: string,
  asOfDate?: string | null,
): Promise<FuturePreparationResponse> {
  return fetchWithFallback<FuturePreparationResponse>([
    withDateParam(`/strategic-planning/player/${playerId}/future-preparation`, asOfDate),
  ]);
}

export async function getStrategicPlanningSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<StrategicPlanningSummaryResponse> {
  return fetchWithFallback<StrategicPlanningSummaryResponse>([
    withDateParam(`/strategic-planning/player/${playerId}/summary`, asOfDate),
  ]);
}
