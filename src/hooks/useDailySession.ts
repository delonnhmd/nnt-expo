import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BALANCE } from '@/lib/balanceConfig';
import { recordInfo, recordWarning } from '@/lib/logger';
import {
  DailyActionHistoryEntry,
  DailyActionItem,
  DailySessionStatus,
  GameplayActionKey,
} from '@/types/gameplay';

export interface ActionExecutionGuard {
  allowed: boolean;
  reason: string | null;
  timeCostUnits: number;
}

// Constants sourced from BALANCE so all tuning is centralised in balanceConfig.
const DEFAULT_TOTAL_TIME_UNITS = BALANCE.DEFAULT_TOTAL_TIME_UNITS;
const MIN_TOTAL_TIME_UNITS = BALANCE.MIN_TOTAL_TIME_UNITS;
const MAX_TOTAL_TIME_UNITS = BALANCE.MAX_TOTAL_TIME_UNITS;
const DEFAULT_ACTION_TIME_COST: Record<string, number> = BALANCE.ACTION_TIME_COST;
const DEFAULT_ACTION_CAPS: Record<string, number> = BALANCE.ACTION_CAPS;

/** Minimal set of fields persisted to AsyncStorage to survive mid-day reloads. */
interface PersistedSessionState {
  currentDay: number;
  remainingTimeUnits: number;
  actionCounts: Record<string, number>;
  sessionStatus: DailySessionStatus;
  totalTimeUnits: number;
}

function normalizeActionKey(key: GameplayActionKey): string {
  const raw = String(key || '').toLowerCase().trim();
  if (raw === 'switch_job' || (raw.includes('switch') && raw.includes('job'))) return 'switch_job';
  if (raw === 'change_region' || ((raw.includes('change') || raw.includes('move')) && raw.includes('region'))) {
    return 'change_region';
  }
  if (raw === 'recovery_action' || (raw.includes('recovery') && raw.includes('action'))) return 'recovery_action';
  if (raw.includes('business') && raw.includes('operate')) return 'operate_business';
  if (raw.includes('inventory') || raw.includes('stock')) return 'buy_inventory';
  if (raw.includes('ride') || raw.includes('delivery') || raw.includes('side_income')) return 'side_income';
  if (raw.includes('work') || raw.includes('shift')) return 'work_shift';
  if (raw.includes('study') || raw.includes('train') || raw.includes('cert')) return 'study';
  if (raw.includes('debt') || raw.includes('payment')) return 'debt_payment';
  if (raw.includes('housing') || raw.includes('region') || raw.includes('move')) return 'change_region';
  if (raw.includes('rest') || raw.includes('recover') || raw.includes('sleep')) return 'rest';
  return raw;
}

function clampTotalUnits(value: number | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_TOTAL_TIME_UNITS;
  return Math.max(MIN_TOTAL_TIME_UNITS, Math.min(MAX_TOTAL_TIME_UNITS, Math.round(parsed)));
}

export function useDailySession(playerId: string) {
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [totalTimeUnits, setTotalTimeUnits] = useState<number>(DEFAULT_TOTAL_TIME_UNITS);
  const [remainingTimeUnits, setRemainingTimeUnits] = useState<number>(DEFAULT_TOTAL_TIME_UNITS);
  const [actionsTakenToday, setActionsTakenToday] = useState<DailyActionHistoryEntry[]>([]);
  const [sessionStatus, setSessionStatus] = useState<DailySessionStatus>('active');
  const [pendingExecution, setPendingExecution] = useState<boolean>(false);
  // Action counts from before this app session (loaded from storage after a reload).
  // Combined with live actionsTakenToday to enforce caps across restarts.
  const [restoredActionCounts, setRestoredActionCounts] = useState<Record<string, number>>({});

  // Prevents concurrent initializeDay calls while a storage read is in flight.
  const initializingRef = useRef(false);

  const sessionStorageKey = useMemo(
    () => (playerId ? `goldpenny:gameplay:session:${playerId}` : null),
    [playerId],
  );

  // Persist key session state so a mid-day reload cannot reset time units or action caps.
  useEffect(() => {
    if (currentDay == null || !sessionStorageKey) return;
    const snapshot: PersistedSessionState = {
      currentDay,
      remainingTimeUnits,
      actionCounts: { ...restoredActionCounts },
      sessionStatus,
      totalTimeUnits,
    };
    // Merge in live session counts so the snapshot always reflects total actions taken today.
    for (const entry of actionsTakenToday) {
      const k = normalizeActionKey(entry.action_key);
      snapshot.actionCounts[k] = (snapshot.actionCounts[k] || 0) + 1;
    }
    AsyncStorage.setItem(sessionStorageKey, JSON.stringify(snapshot)).catch((error) => {
      recordWarning('dailySession', 'Failed to persist daily session snapshot.', {
        action: 'persist_snapshot',
        context: {
          currentDay,
          actionCount: actionsTakenToday.length,
          remainingTimeUnits,
          sessionStatus,
        },
        error,
      });
    });
  }, [
    currentDay,
    remainingTimeUnits,
    restoredActionCounts,
    sessionStatus,
    totalTimeUnits,
    actionsTakenToday,
    sessionStorageKey,
  ]);

  // Derived action counts: persisted (pre-reload) + live (this session).
  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = { ...restoredActionCounts };
    for (const entry of actionsTakenToday) {
      const normalized = normalizeActionKey(entry.action_key);
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
    return counts;
  }, [actionsTakenToday, restoredActionCounts]);

  const initializeDay = useCallback((nextDay: number, suggestedTotalUnits?: number) => {
    const normalizedDay = Math.max(1, Math.round(Number(nextDay) || 0));
    if (!Number.isFinite(normalizedDay) || normalizedDay < 1) return;
    if (normalizedDay === currentDay) return;
    if (initializingRef.current) return;
    initializingRef.current = true;

    const clamped = clampTotalUnits(suggestedTotalUnits);

    const freshInit = (dayNumber: number, units: number) => {
      setCurrentDay(dayNumber);
      setTotalTimeUnits(units);
      setRemainingTimeUnits(units);
      setRestoredActionCounts({});
      setActionsTakenToday([]);
      setSessionStatus('active');
      setPendingExecution(false);
      if (sessionStorageKey) {
        AsyncStorage.removeItem(sessionStorageKey).catch((error) => {
          recordWarning('dailySession', 'Failed to clear stale session snapshot.', {
            action: 'initialize_day',
            context: {
              currentDay: dayNumber,
            },
            error,
          });
        });
      }
    };

    if (!sessionStorageKey) {
      freshInit(normalizedDay, clamped);
      initializingRef.current = false;
      return;
    }

    AsyncStorage.getItem(sessionStorageKey)
      .then((raw) => {
        if (raw) {
          try {
            const persisted: PersistedSessionState = JSON.parse(raw);
            if (persisted.currentDay === normalizedDay) {
              // Same game day found in storage — restore to prevent reload-to-reset exploits.
              const restoredUnits = Math.max(
                0,
                Math.min(MAX_TOTAL_TIME_UNITS, Number(persisted.remainingTimeUnits) || 0),
              );
              const restoredTotal = clampTotalUnits(persisted.totalTimeUnits);
              const restoredStatus: DailySessionStatus =
                persisted.sessionStatus === 'ended' ? 'ended' : 'active';
              const restoredCounts =
                typeof persisted.actionCounts === 'object' && persisted.actionCounts !== null
                  ? (persisted.actionCounts as Record<string, number>)
                  : {};
              setCurrentDay(normalizedDay);
              setTotalTimeUnits(restoredTotal);
              setRemainingTimeUnits(restoredUnits);
              setRestoredActionCounts(restoredCounts);
              setActionsTakenToday([]);
              setSessionStatus(restoredStatus);
              setPendingExecution(false);
              recordInfo('dailySession', 'Restored persisted session snapshot.', {
                action: 'initialize_day',
                context: {
                  currentDay: normalizedDay,
                  restoredRemainingTimeUnits: restoredUnits,
                  restoredStatus,
                  restoredActionTypes: Object.keys(restoredCounts).length,
                },
              });
              initializingRef.current = false;
              return;
            }
          } catch (error) {
            recordWarning('dailySession', 'Stored session snapshot was invalid.', {
              action: 'initialize_day',
              context: {
                currentDay: normalizedDay,
              },
              error,
            });
            // Corrupted storage — fall through to fresh init.
          }
        }
        freshInit(normalizedDay, clamped);
        initializingRef.current = false;
      })
      .catch((error) => {
        recordWarning('dailySession', 'Failed to read persisted session snapshot.', {
          action: 'initialize_day',
          context: {
            currentDay: normalizedDay,
          },
          error,
        });
        freshInit(normalizedDay, clamped);
        initializingRef.current = false;
      });
  }, [currentDay, sessionStorageKey]);

  const estimateTimeCost = useCallback(
    (actionKey: GameplayActionKey, explicitCost?: number): number => {
      if (Number.isFinite(explicitCost)) {
        return Math.max(1, Math.min(4, Number(explicitCost)));
      }
      const normalized = normalizeActionKey(actionKey);
      const mapped = DEFAULT_ACTION_TIME_COST[normalized] ?? 2;
      return Math.max(1, Math.min(4, mapped));
    },
    [],
  );

  const getActionCount = useCallback(
    (actionKey: GameplayActionKey): number => {
      const normalized = normalizeActionKey(actionKey);
      return actionCounts[normalized] || 0;
    },
    [actionCounts],
  );

  const canExecuteAction = useCallback(
    (action: DailyActionItem | { action_key: GameplayActionKey; status?: string; blockers?: string[] }, explicitCost?: number): ActionExecutionGuard => {
      const timeCostUnits = estimateTimeCost(action.action_key, explicitCost);
      if (pendingExecution) {
        return { allowed: false, reason: 'Another action is already in progress.', timeCostUnits };
      }
      if (sessionStatus !== 'active') {
        return { allowed: false, reason: 'Day already ended. Start next day to continue.', timeCostUnits };
      }
      if (action.status === 'blocked') {
        const blockedReason = Array.isArray(action.blockers) && action.blockers.length > 0
          ? action.blockers[0]
          : 'Action is currently blocked.';
        return { allowed: false, reason: blockedReason, timeCostUnits };
      }
      const normalized = normalizeActionKey(action.action_key);
      const cap = DEFAULT_ACTION_CAPS[normalized];
      if (cap && getActionCount(normalized) >= cap) {
        return { allowed: false, reason: 'You already used this action enough times today.', timeCostUnits };
      }
      if (remainingTimeUnits < timeCostUnits) {
        return { allowed: false, reason: 'Not enough time today.', timeCostUnits };
      }
      return { allowed: true, reason: null, timeCostUnits };
    },
    [estimateTimeCost, getActionCount, pendingExecution, remainingTimeUnits, sessionStatus],
  );

  const consumeTime = useCallback((amount: number) => {
    const delta = Math.max(0, Number(amount) || 0);
    setRemainingTimeUnits((prev) => Math.max(0, prev - delta));
  }, []);

  const addActionToHistory = useCallback((entry: Omit<DailyActionHistoryEntry, 'id' | 'order' | 'executed_at'>) => {
    setActionsTakenToday((prev) => {
      const nextOrder = prev.length + 1;
      const next: DailyActionHistoryEntry = {
        id: `${Date.now()}_${nextOrder}_${String(entry.action_key)}`,
        order: nextOrder,
        executed_at: new Date().toISOString(),
        ...entry,
      };
      return [next, ...prev];
    });
  }, []);

  const endDay = useCallback(() => {
    setSessionStatus('ended');
    setPendingExecution(false);
  }, []);

  const resetSession = useCallback((options?: { totalUnits?: number; nextDay?: number }) => {
    const clamped = clampTotalUnits(options?.totalUnits ?? totalTimeUnits);
    if (Number.isFinite(options?.nextDay)) {
      setCurrentDay(Math.max(1, Math.round(Number(options?.nextDay))));
    }
    setTotalTimeUnits(clamped);
    setRemainingTimeUnits(clamped);
    setRestoredActionCounts({});
    setActionsTakenToday([]);
    setSessionStatus('active');
    setPendingExecution(false);
    recordInfo('dailySession', 'Session reset for new day.', {
      action: 'reset_session',
      context: {
        nextDay: options?.nextDay ?? currentDay,
        totalTimeUnits: clamped,
      },
    });
    // Clear stale storage so the incoming new day starts completely fresh.
    if (sessionStorageKey) {
      AsyncStorage.removeItem(sessionStorageKey).catch((error) => {
        recordWarning('dailySession', 'Failed to clear session snapshot during reset.', {
          action: 'reset_session',
          context: {
            nextDay: options?.nextDay ?? currentDay,
          },
          error,
        });
      });
    }
  }, [currentDay, totalTimeUnits, sessionStorageKey]);

  const progress = useMemo(() => {
    if (totalTimeUnits <= 0) return 0;
    const used = totalTimeUnits - remainingTimeUnits;
    return Math.max(0, Math.min(1, used / totalTimeUnits));
  }, [remainingTimeUnits, totalTimeUnits]);

  return {
    currentDay,
    totalTimeUnits,
    remainingTimeUnits,
    actionsTakenToday,
    sessionStatus,
    pendingExecution,
    progress,
    initializeDay,
    estimateTimeCost,
    getActionCount,
    canExecuteAction,
    consumeTime,
    addActionToHistory,
    setPendingExecution,
    endDay,
    resetSession,
  };
}
