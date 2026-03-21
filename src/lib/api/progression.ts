import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';
import {
  DailyGoalItem,
  DailyGoalsResponse,
  ProgressionSummaryResponse,
  StreakItem,
  StreaksResponse,
  WeeklyMissionItem,
  WeeklyMissionsResponse,
} from '@/types/progression';

async function getBaseUrl(): Promise<string> {
  try {
    const override = await AsyncStorage.getItem('backend:override');
    if (override && /^https?:\/\//i.test(override)) {
      return override.replace(/\/$/, '');
    }
  } catch {
    // Use default backend URL.
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
      // Ignore persistence failure.
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

async function fetchJsonPath<T>(path: string, init?: RequestInit): Promise<T> {
  const base = await getBaseUrl();
  if (!base) {
    throw new Error('Backend URL is not configured. Set EXPO_PUBLIC_BACKEND or backend override.');
  }

  let adminToken: string | null = null;
  try {
    adminToken = await AsyncStorage.getItem('admin:token');
  } catch {
    adminToken = null;
  }
  const identityHeaders = await getIdentityHeaders();

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...identityHeaders,
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      ...(init?.headers || {}),
    },
  } as RequestInit);

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Non-JSON response at ${path}`);
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

async function fetchWithFallback<T>(paths: string[], init?: RequestInit): Promise<T> {
  const errors: string[] = [];
  for (const path of paths) {
    try {
      return await fetchJsonPath<T>(path, init);
    } catch (error: unknown) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(errors.join(' | '));
}

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

function toStatus(value: unknown): DailyGoalItem['status'] {
  const normalized = toString(value, 'not_started').toLowerCase();
  if (normalized === 'completed') return 'completed';
  if (normalized === 'in_progress') return 'in_progress';
  if (normalized === 'failed') return 'failed';
  return 'not_started';
}

function normalizeDailyGoals(raw: Record<string, unknown>, playerId: string): DailyGoalsResponse {
  const list = Array.isArray(raw.daily_goals) ? raw.daily_goals : [];
  return {
    player_id: toString(raw.player_id, playerId),
    as_of_date: toString(raw.as_of_date, ''),
    daily_goals: list.map((entry, index) => {
      const item = (entry || {}) as Record<string, unknown>;
      return {
        goal_key: toString(item.goal_key, `goal_${index}`),
        title: toString(item.title, 'Goal'),
        description: toString(item.description, ''),
        status: toStatus(item.status),
        progress_current: toNumber(item.progress_current),
        progress_target: Math.max(1, toNumber(item.progress_target, 1)),
        reward_summary: toString(item.reward_summary, ''),
        urgency: toString(item.urgency, 'medium'),
        expires_on: toString(item.expires_on, ''),
        debug_meta: (item.debug_meta as Record<string, unknown>) || {},
      };
    }),
    debug_meta: (raw.debug_meta as Record<string, unknown>) || {},
  };
}

function normalizeWeeklyMissions(raw: Record<string, unknown>, playerId: string): WeeklyMissionsResponse {
  const list = Array.isArray(raw.weekly_missions) ? raw.weekly_missions : [];
  return {
    player_id: toString(raw.player_id, playerId),
    as_of_date: toString(raw.as_of_date, ''),
    weekly_missions: list.map((entry, index) => {
      const item = (entry || {}) as Record<string, unknown>;
      return {
        mission_key: toString(item.mission_key, `mission_${index}`),
        title: toString(item.title, 'Mission'),
        description: toString(item.description, ''),
        status: toStatus(item.status),
        progress_current: toNumber(item.progress_current),
        progress_target: Math.max(1, toNumber(item.progress_target, 1)),
        reward_summary: toString(item.reward_summary, ''),
        week_start: toString(item.week_start, ''),
        week_end: toString(item.week_end, ''),
        category: toString(item.category, 'weekly'),
        debug_meta: (item.debug_meta as Record<string, unknown>) || {},
      };
    }),
    debug_meta: (raw.debug_meta as Record<string, unknown>) || {},
  };
}

function normalizeStreaks(raw: Record<string, unknown>, playerId: string): StreaksResponse {
  const list = Array.isArray(raw.streaks) ? raw.streaks : [];
  return {
    player_id: toString(raw.player_id, playerId),
    as_of_date: toString(raw.as_of_date, ''),
    streaks: list.map((entry, index) => {
      const item = (entry || {}) as Record<string, unknown>;
      return {
        streak_key: toString(item.streak_key, `streak_${index}`),
        title: toString(item.title, 'Streak'),
        current_count: Math.max(0, Math.round(toNumber(item.current_count))),
        best_count: Math.max(0, Math.round(toNumber(item.best_count))),
        status: toString(item.status, 'idle'),
        last_credited_on: toString(item.last_credited_on, ''),
        reset_risk: toString(item.reset_risk, 'high'),
        next_credit_condition: toString(item.next_credit_condition, ''),
        debug_meta: (item.debug_meta as Record<string, unknown>) || {},
      };
    }),
    debug_meta: (raw.debug_meta as Record<string, unknown>) || {},
  };
}

function normalizeSummary(raw: Record<string, unknown>, playerId: string): ProgressionSummaryResponse {
  const daily = normalizeDailyGoals(raw, playerId).daily_goals;
  const weekly = normalizeWeeklyMissions(raw, playerId).weekly_missions;
  const streaks = normalizeStreaks(raw, playerId).streaks;
  const recentlyCompleted = Array.isArray(raw.recently_completed)
    ? raw.recently_completed.map((entry) => {
      const item = (entry || {}) as Record<string, unknown>;
      return {
        scope: toString(item.scope, ''),
        key: toString(item.key, ''),
        title: toString(item.title, ''),
        credited_on: toString(item.credited_on, ''),
        reward_summary: toString(item.reward_summary, ''),
      };
    })
    : [];
  return {
    player_id: toString(raw.player_id, playerId),
    as_of_date: toString(raw.as_of_date, ''),
    daily_goals: daily,
    weekly_missions: weekly,
    streaks,
    recently_completed: recentlyCompleted,
    suggested_focus: Array.isArray(raw.suggested_focus)
      ? raw.suggested_focus.map((entry) => toString(entry)).filter(Boolean)
      : [],
    motivational_summary: toString(raw.motivational_summary, ''),
    debug_meta: (raw.debug_meta as Record<string, unknown>) || {},
  };
}

export async function getDailyGoals(playerId: string): Promise<DailyGoalsResponse> {
  const raw = await fetchWithFallback<Record<string, unknown>>([
    `/progression/player/${playerId}/daily-goals`,
  ]);
  return normalizeDailyGoals(raw, playerId);
}

export async function getWeeklyMissions(playerId: string): Promise<WeeklyMissionsResponse> {
  const raw = await fetchWithFallback<Record<string, unknown>>([
    `/progression/player/${playerId}/weekly-missions`,
  ]);
  return normalizeWeeklyMissions(raw, playerId);
}

export async function getPlayerStreaks(playerId: string): Promise<StreaksResponse> {
  const raw = await fetchWithFallback<Record<string, unknown>>([
    `/progression/player/${playerId}/streaks`,
  ]);
  return normalizeStreaks(raw, playerId);
}

export async function getProgressionSummary(playerId: string): Promise<ProgressionSummaryResponse> {
  const raw = await fetchWithFallback<Record<string, unknown>>([
    `/progression/player/${playerId}/summary`,
  ]);
  return normalizeSummary(raw, playerId);
}

export async function refreshProgression(playerId: string): Promise<ProgressionSummaryResponse> {
  const raw = await fetchWithFallback<Record<string, unknown>>(
    [
      `/progression/player/${playerId}/refresh`,
    ],
    {
      method: 'POST',
      body: '{}',
    },
  );
  return normalizeSummary(raw, playerId);
}
