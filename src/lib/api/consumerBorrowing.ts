import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  BorrowingDecisionRequest,
  BorrowingDecisionResponse,
  BorrowingEligibilityProfileResponse,
  BorrowingOptionsResponse,
  BorrowingPressureSummaryResponse,
  BorrowingRiskSummaryResponse,
  ConsumerBorrowingSystemSummaryResponse,
  EmergencyLiquidityStateResponse,
  PlayerBorrowingHistoryResponse,
  PlayerLoanAccountsResponse,
} from '@/types/consumerBorrowing';

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

async function postJsonPath<T>(path: string, body: Record<string, unknown>): Promise<T> {
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
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...identityHeaders,
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
    body: JSON.stringify(body),
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

export async function getBorrowingEligibilityProfile(
  playerId: string,
  asOfDate?: string | null,
): Promise<BorrowingEligibilityProfileResponse> {
  return fetchJsonPath<BorrowingEligibilityProfileResponse>(
    withDate(`/borrowing/player/${playerId}/eligibility-profile`, asOfDate),
  );
}

export async function getEmergencyLiquidityState(
  playerId: string,
  asOfDate?: string | null,
): Promise<EmergencyLiquidityStateResponse> {
  return fetchJsonPath<EmergencyLiquidityStateResponse>(
    withDate(`/borrowing/player/${playerId}/liquidity-state`, asOfDate),
  );
}

export async function getBorrowingOptions(
  playerId: string,
  asOfDate?: string | null,
): Promise<BorrowingOptionsResponse> {
  return fetchJsonPath<BorrowingOptionsResponse>(
    withDate(`/borrowing/player/${playerId}/options`, asOfDate),
  );
}

export async function getBorrowingRiskSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<BorrowingRiskSummaryResponse> {
  return fetchJsonPath<BorrowingRiskSummaryResponse>(
    withDate(`/borrowing/player/${playerId}/risk-summary`, asOfDate),
  );
}

export async function getBorrowingPressureSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<BorrowingPressureSummaryResponse> {
  return fetchJsonPath<BorrowingPressureSummaryResponse>(
    withDate(`/borrowing/player/${playerId}/pressure-summary`, asOfDate),
  );
}

export async function acceptBorrowingOffer(
  playerId: string,
  payload: BorrowingDecisionRequest,
): Promise<BorrowingDecisionResponse> {
  return postJsonPath<BorrowingDecisionResponse>(
    `/borrowing/player/${playerId}/accept-offer`,
    payload as unknown as Record<string, unknown>,
  );
}

export async function getBorrowingLoanAccounts(
  playerId: string,
): Promise<PlayerLoanAccountsResponse> {
  return fetchJsonPath<PlayerLoanAccountsResponse>(`/borrowing/player/${playerId}/loan-accounts`);
}

export async function getBorrowingHistory(
  playerId: string,
  asOfDate?: string | null,
): Promise<PlayerBorrowingHistoryResponse> {
  return fetchJsonPath<PlayerBorrowingHistoryResponse>(
    withDate(`/borrowing/player/${playerId}/history`, asOfDate),
  );
}

export async function getConsumerBorrowingSummary(
  playerId: string,
  asOfDate?: string | null,
): Promise<ConsumerBorrowingSystemSummaryResponse> {
  return fetchJsonPath<ConsumerBorrowingSystemSummaryResponse>(
    withDate(`/borrowing/player/${playerId}/summary`, asOfDate),
  );
}
