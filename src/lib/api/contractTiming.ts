// Step 41 — Contract Timing, Recurring Obligations, and Calendar Pressure API client

import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  CashTimingPressureStateResponse,
  ContractPressureSummaryResponse,
  DueSoonSummaryResponse,
  PlayerContractScheduleResponse,
  UpcomingObligationWindowResponse,
} from '@/types/contractTiming';

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
    throw new Error(`Contract timing API error ${resp.status}: ${text}`);
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
    throw new Error(`Contract timing API error ${resp.status}: ${text}`);
  }
  return resp.json() as Promise<T>;
}

function dayParam(day?: number): string {
  return day !== undefined ? `?day=${day}` : '';
}

// ---------------------------------------------------------------------------
// Contract schedule (build + persist)
// ---------------------------------------------------------------------------

export async function getContractSchedule(
  playerId: string,
  day?: number,
): Promise<PlayerContractScheduleResponse> {
  return fetchJsonPath(`/contracts/player/${playerId}/schedule${dayParam(day)}`);
}

// ---------------------------------------------------------------------------
// Upcoming obligation window
// ---------------------------------------------------------------------------

export async function getUpcomingObligationWindow(
  playerId: string,
  day?: number,
): Promise<UpcomingObligationWindowResponse> {
  return fetchJsonPath(`/contracts/player/${playerId}/upcoming-window${dayParam(day)}`);
}

// ---------------------------------------------------------------------------
// Cash timing pressure state
// ---------------------------------------------------------------------------

export async function getCashTimingPressure(
  playerId: string,
  day?: number,
): Promise<CashTimingPressureStateResponse> {
  return fetchJsonPath(`/contracts/player/${playerId}/cash-timing-pressure${dayParam(day)}`);
}

// ---------------------------------------------------------------------------
// Due-soon summary
// ---------------------------------------------------------------------------

export async function getDueSoonSummary(
  playerId: string,
  day?: number,
): Promise<DueSoonSummaryResponse> {
  return fetchJsonPath(`/contracts/player/${playerId}/due-soon-summary${dayParam(day)}`);
}

// ---------------------------------------------------------------------------
// Full pressure summary
// ---------------------------------------------------------------------------

export async function getContractPressureSummary(
  playerId: string,
  day?: number,
): Promise<ContractPressureSummaryResponse> {
  return fetchJsonPath(`/contracts/player/${playerId}/pressure-summary${dayParam(day)}`);
}

// ---------------------------------------------------------------------------
// Mutations (POST)
// ---------------------------------------------------------------------------

export async function generateContracts(
  playerId: string,
  day?: number,
): Promise<Record<string, unknown>> {
  return postJsonPath(`/contracts/player/${playerId}/generate-contracts${dayParam(day)}`);
}

export async function advanceContractEvents(
  playerId: string,
  day?: number,
): Promise<Record<string, unknown>> {
  return postJsonPath(`/contracts/player/${playerId}/advance-events${dayParam(day)}`);
}
