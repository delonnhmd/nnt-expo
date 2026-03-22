// Gold Penny — shared API client for all gameplay API modules.
// Centralises persistence keys, identity headers, fetch logic, and migration.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKEND } from '@/constants';

// ─── Canonical AsyncStorage key registry ─────────────────────────────────────
// Authoritative key names. All active writes use these.
// Legacy keys are read once for migration and then discarded.

/** Override URL for the active backend — set via Settings screen. */
export const KEY_BACKEND_OVERRIDE = 'backend:override';

/** Admin bearer token — set via Settings screen. */
export const KEY_ADMIN_TOKEN = 'admin:token';

/** Admin wallet/player address — set via Settings screen. */
export const KEY_ADMIN_ADDRESS = 'admin:address';

/**
 * Anonymous device identity UID — used for API tracing headers.
 * Canonical key; migrates from legacy 'identity:uid' on first read.
 */
export const KEY_IDENTITY_UID = 'goldpenny:identity:uid';

/** @deprecated Legacy identity key — read-only fallback during migration. */
const LEGACY_KEY_IDENTITY_UID = 'identity:uid';
// ─────────────────────────────────────────────────────────────────────────────

/** Resolve the active backend base URL. Falls back to env var when no override is stored. */
export async function getBaseUrl(): Promise<string> {
  try {
    const override = await AsyncStorage.getItem(KEY_BACKEND_OVERRIDE);
    if (override && /^https?:\/\//i.test(override)) {
      return override.replace(/\/$/, '');
    }
  } catch {
    // Use compiled BACKEND when local override lookup fails.
  }
  return (BACKEND || '').replace(/\/$/, '');
}

/**
 * Resolve or create the anonymous device UID.
 * On first call after an app upgrade, reads the legacy key and migrates
 * the value to the canonical key before returning it.
 */
async function resolveIdentityUid(): Promise<string> {
  // Try canonical key first.
  try {
    const uid = await AsyncStorage.getItem(KEY_IDENTITY_UID);
    if (uid) return uid;
  } catch {
    // Fall through.
  }

  // Migration: read legacy key and promote.
  let uid = '';
  try {
    uid = (await AsyncStorage.getItem(LEGACY_KEY_IDENTITY_UID)) || '';
  } catch {
    uid = '';
  }

  if (!uid) {
    uid = `uid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  // Write to canonical key; silently continue on failure.
  try {
    await AsyncStorage.setItem(KEY_IDENTITY_UID, uid);
  } catch {
    // No-op — continue without persistence.
  }

  return uid;
}

/** Build the identity + device fingerprint headers sent with every API request. */
export async function getIdentityHeaders(): Promise<Record<string, string>> {
  const uid = await resolveIdentityUid();
  const ua =
    typeof navigator !== 'undefined' && (navigator as any)?.userAgent
      ? String((navigator as any).userAgent)
      : 'expo';
  return {
    'X-UID': uid,
    'X-Device-FP': ua,
  };
}

/**
 * Core API fetch: resolves base URL + auth headers, makes a JSON request,
 * and throws a clean error for non-2xx or non-JSON responses.
 *
 * Replaces the copy-pasted `fetchJsonPath` in every API module.
 */
export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const base = await getBaseUrl();
  if (!base) {
    throw new Error('Backend URL is not configured. Set EXPO_PUBLIC_BACKEND or the backend override in Settings.');
  }

  let adminToken: string | null = null;
  try {
    adminToken = await AsyncStorage.getItem(KEY_ADMIN_TOKEN);
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
    const snippet = (text || '').slice(0, 180);
    throw new Error(`Non-JSON response at ${path}: ${snippet}`);
  }

  if (!response.ok) {
    const detail =
      typeof payload === 'object' && payload && 'detail' in (payload as object)
        ? String((payload as any).detail)
        : typeof payload === 'object' && payload && 'error' in (payload as object)
          ? String((payload as any).error)
          : `HTTP ${response.status}`;
    throw new Error(`${path}: ${detail}`);
  }

  return payload as T;
}

/**
 * Try multiple URL paths in order, returning the first success.
 * All errors are accumulated and thrown together if every path fails.
 *
 * Replaces the copy-pasted `fetchWithFallback` in every API module.
 */
export async function fetchApiWithFallback<T>(paths: string[], init?: RequestInit): Promise<T> {
  const errors: string[] = [];
  for (const path of paths) {
    try {
      return await fetchApi<T>(path, init);
    } catch (error: unknown) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(errors.join(' | '));
}
