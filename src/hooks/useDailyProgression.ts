import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { recordInfo, recordWarning } from '@/lib/logger';
import { DailySessionStatus } from '@/types/gameplay';

const DAY_STORAGE_KEY = (playerId: string) => `goldpenny:gameplay:day:${playerId}`;
const LAST_PROCESSED_KEY = (playerId: string) => `goldpenny:gameplay:lastProcessedDay:${playerId}`;

const DEFAULT_START_DAY = 1;

export interface DailyProgressionContract {
  /** Current game day number — starts at 1, increments each time a new day begins. */
  currentGameDay: number;
  /** The last game day confirmed as fully settled with the backend. Null until first end-of-day. */
  lastProcessedDay: number | null;
  /**
   * True when the player may safely end the current day.
   * Requires: session active, no action in flight, and today not yet processed.
   */
  canAdvanceDay: boolean;
  /** True while a day-advance persistence operation is in flight. */
  isAdvancingDay: boolean;
  /**
   * Record the current game day as settled.
   * Persists lastProcessedDay to storage.
   * Pass the backend-confirmed settled_day when available for accuracy.
   */
  markDayAdvanced: (settledDay?: number | null) => Promise<void>;
  /**
   * Start a new game day: increments currentGameDay, persists it asynchronously,
   * and returns the new day number synchronously so callers can use it immediately.
   */
  markDayStarted: () => number;
}

export function useDailyProgression(
  playerId: string,
  sessionStatus: DailySessionStatus,
  actionInProgress: boolean,
): DailyProgressionContract {
  const [currentGameDay, setCurrentGameDay] = useState<number>(DEFAULT_START_DAY);
  const [lastProcessedDay, setLastProcessedDay] = useState<number | null>(null);
  const [isAdvancingDay, setIsAdvancingDay] = useState(false);

  // Ref mirrors so callbacks always read the latest values without stale closure issues.
  const currentGameDayRef = useRef(currentGameDay);
  currentGameDayRef.current = currentGameDay;

  const initialized = useRef(false);
  // Prevents markDayStarted from advancing more than one day per button press.
  const markingDayRef = useRef(false);

  useEffect(() => {
    if (!playerId || initialized.current) return;
    initialized.current = true;

    async function loadPersistedState() {
      try {
        const [storedDay, storedLastProcessed] = await Promise.all([
          AsyncStorage.getItem(DAY_STORAGE_KEY(playerId)),
          AsyncStorage.getItem(LAST_PROCESSED_KEY(playerId)),
        ]);

        if (storedDay) {
          const parsed = parseInt(storedDay, 10);
          if (Number.isFinite(parsed) && parsed >= DEFAULT_START_DAY) {
            setCurrentGameDay(parsed);
          }
        }

        if (storedLastProcessed) {
          const parsed = parseInt(storedLastProcessed, 10);
          if (Number.isFinite(parsed) && parsed >= 0) {
            setLastProcessedDay(parsed);
          }
        }
      } catch (error) {
        recordWarning('dailyProgression', 'Failed to hydrate persisted day state.', {
          action: 'load_persisted_state',
          context: {
            hasPlayerId: Boolean(playerId),
          },
          error,
        });
        // Continue with safe defaults when storage is unavailable.
      }
    }

    loadPersistedState();
  }, [playerId]);

  const canAdvanceDay =
    sessionStatus === 'active' &&
    !actionInProgress &&
    !isAdvancingDay &&
    currentGameDay !== lastProcessedDay;

  const markDayAdvanced = useCallback(async (settledDay?: number | null): Promise<void> => {
    setIsAdvancingDay(true);
    try {
      const processedDay =
        settledDay != null && Number.isFinite(settledDay) && settledDay > 0
          ? settledDay
          : currentGameDayRef.current;

      setLastProcessedDay(processedDay);
      await AsyncStorage.setItem(LAST_PROCESSED_KEY(playerId), String(processedDay));
      recordInfo('dailyProgression', 'Marked day as settled.', {
        action: 'mark_day_advanced',
        context: {
          processedDay,
        },
      });
    } catch (error) {
      recordWarning('dailyProgression', 'Failed to persist settled day.', {
        action: 'mark_day_advanced',
        context: {
          currentDay: currentGameDayRef.current,
        },
        error,
      });
      // Proceed even when persistence fails — in-memory update is applied.
    } finally {
      setIsAdvancingDay(false);
    }
  }, [playerId]);

  const markDayStarted = useCallback((): number => {
    // Synchronous guard prevents double-advance on rapid double-tap of "Start Next Day".
    if (markingDayRef.current) return currentGameDayRef.current;
    markingDayRef.current = true;
    const nextDay = currentGameDayRef.current + 1;
    setCurrentGameDay(nextDay);
    currentGameDayRef.current = nextDay;
    recordInfo('dailyProgression', 'Started next day.', {
      action: 'mark_day_started',
      context: {
        nextDay,
      },
    });
    AsyncStorage.setItem(DAY_STORAGE_KEY(playerId), String(nextDay)).catch((error) => {
      recordWarning('dailyProgression', 'Failed to persist current day.', {
        action: 'mark_day_started',
        context: {
          nextDay,
        },
        error,
      });
    });
    // Allow another call only after React's event loop has processed the state update.
    setTimeout(() => { markingDayRef.current = false; }, 0);
    return nextDay;
  }, [playerId]);

  return useMemo(
    () => ({
      currentGameDay,
      lastProcessedDay,
      canAdvanceDay,
      isAdvancingDay,
      markDayAdvanced,
      markDayStarted,
    }),
    [currentGameDay, lastProcessedDay, canAdvanceDay, isAdvancingDay, markDayAdvanced, markDayStarted],
  );
}
