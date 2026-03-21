import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  CreditImpactSummaryResponse,
  DelinquencyStateResponse,
  FinancialSurvivalPaymentHistoryResponse,
  FinancialSurvivalSummaryResponse,
  FinancialSurvivalSystemSummaryResponse,
  PaymentRiskStateResponse,
  PlayerObligationProfileResponse,
} from '@/types/financialSurvival';

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

export async function getObligationProfile(
  playerId: string,
  asOfDate?: string | null,
): Promise<PlayerObligationProfileResponse> {
  return fetchJsonPath<PlayerObligationProfileResponse>(
    withDate(`/financial/player/${playerId}/obligation-profile`, asOfDate),
  );
}

export async function getPaymentRiskState(
  playerId: string,
  asOfDate?: string | null,
): Promise<PaymentRiskStateResponse> {
  return fetchJsonPath<PaymentRiskStateResponse>(
    withDate(`/financial/player/${playerId}/payment-risk`, asOfDate),
  );
}

export async function getDelinquencyState(
  playerId: string,
  asOfDate?: string | null,
): Promise<DelinquencyStateResponse> {
  return fetchJsonPath<DelinquencyStateResponse>(
    withDate(`/financial/player/${playerId}/delinquency-state`, asOfDate),
  );
}

export async function getCreditImpact(
  playerId: string,
  asOfDate?: string | null,
): Promise<CreditImpactSummaryResponse> {
  return fetchJsonPath<CreditImpactSummaryResponse>(
    withDate(`/financial/player/${playerId}/credit-impact`, asOfDate),
  );
}

export async function getFinancialSurvivalSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<FinancialSurvivalSummaryResponse> {
  return fetchJsonPath<FinancialSurvivalSummaryResponse>(
    withDate(`/financial/player/${playerId}/survival-summary`, asOfDate),
  );
}

export async function getFinancialPaymentHistory(
  playerId: string,
  asOfDate?: string | null,
): Promise<FinancialSurvivalPaymentHistoryResponse> {
  return fetchJsonPath<FinancialSurvivalPaymentHistoryResponse>(
    withDate(`/financial/player/${playerId}/payment-history`, asOfDate),
  );
}

export async function getFinancialSurvivalSystemSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<FinancialSurvivalSystemSummaryResponse> {
  return fetchJsonPath<FinancialSurvivalSystemSummaryResponse>(
    withDate(`/financial/player/${playerId}/summary`, asOfDate),
  );
}

