// Step 42 — Forecasting, Planning Intelligence, and Forward Projection Layer API client

import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  DecisionGuidanceResponse,
  ForecastSnapshotResponse,
  ForecastSummaryResponse,
  RiskProjectionResponse,
  ScenarioComparisonRequest,
  ScenarioComparisonResponse,
  ShortTermForecastResponse,
  SimulationRequest,
  SimulationResponse,
} from '@/types/forecasting';

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
    throw new Error(`Forecasting API error ${resp.status}: ${text}`);
  }
  return resp.json() as Promise<T>;
}

async function postJsonPath<T>(path: string, body: unknown): Promise<T> {
  const base = await getBaseUrl();
  if (!base) {
    throw new Error('Backend URL is not configured. Set EXPO_PUBLIC_BACKEND or backend override.');
  }
  const headers = await getIdentityHeaders();
  const resp = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`Forecasting API error ${resp.status}: ${text}`);
  }
  return resp.json() as Promise<T>;
}

function dayParam(day?: number, extraParams?: string): string {
  const parts: string[] = [];
  if (day !== undefined) parts.push(`day=${day}`);
  if (extraParams) parts.push(extraParams);
  return parts.length ? `?${parts.join('&')}` : '';
}

// ---------------------------------------------------------------------------
// 1. Short-term cash-flow forecast
// ---------------------------------------------------------------------------

export async function getShortTermForecast(
  playerId: string,
  day?: number,
  horizonDays: number = 14,
): Promise<ShortTermForecastResponse> {
  const extra = `horizon_days=${horizonDays}`;
  return fetchJsonPath(`/forecast/player/${playerId}/short-term${dayParam(day, extra)}`);
}

// ---------------------------------------------------------------------------
// 2. Risk projection / danger radar
// ---------------------------------------------------------------------------

export async function getRiskProjection(
  playerId: string,
  day?: number,
  horizonDays: number = 14,
): Promise<RiskProjectionResponse> {
  const extra = `horizon_days=${horizonDays}`;
  return fetchJsonPath(`/forecast/player/${playerId}/risk${dayParam(day, extra)}`);
}

// ---------------------------------------------------------------------------
// 3. Forecast summary
// ---------------------------------------------------------------------------

export async function getForecastSummary(
  playerId: string,
  day?: number,
  horizonDays: number = 14,
): Promise<ForecastSummaryResponse> {
  const extra = `horizon_days=${horizonDays}`;
  return fetchJsonPath(`/forecast/player/${playerId}/summary${dayParam(day, extra)}`);
}

// ---------------------------------------------------------------------------
// 4. Simulate a hypothetical action
// ---------------------------------------------------------------------------

export async function simulateAction(
  playerId: string,
  req: SimulationRequest,
  day?: number,
): Promise<SimulationResponse> {
  return postJsonPath(`/forecast/player/${playerId}/simulate${dayParam(day)}`, req);
}

// ---------------------------------------------------------------------------
// 5. Scenario comparison
// ---------------------------------------------------------------------------

export async function compareScenarios(
  playerId: string,
  req: ScenarioComparisonRequest,
  day?: number,
): Promise<ScenarioComparisonResponse> {
  return postJsonPath(`/forecast/player/${playerId}/compare${dayParam(day)}`, req);
}

// ---------------------------------------------------------------------------
// 6. Decision guidance
// ---------------------------------------------------------------------------

export async function getDecisionGuidance(
  playerId: string,
  day?: number,
  horizonDays: number = 14,
): Promise<DecisionGuidanceResponse> {
  const extra = `horizon_days=${horizonDays}`;
  return fetchJsonPath(`/forecast/player/${playerId}/guidance${dayParam(day, extra)}`);
}

// ---------------------------------------------------------------------------
// 7. Build and persist forecast snapshot
// ---------------------------------------------------------------------------

export async function buildForecastSnapshot(
  playerId: string,
  day?: number,
  horizonDays: number = 14,
): Promise<ForecastSnapshotResponse> {
  const extra = `horizon_days=${horizonDays}`;
  return postJsonPath(`/forecast/player/${playerId}/snapshot${dayParam(day, extra)}`, {});
}
