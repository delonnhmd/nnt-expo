// Gold Penny — random event hook.
// Rolls one deterministic event per game day, persists it, and exposes recovery actions.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getAvailableRecoveryActions,
  RANDOM_EVENT_POOL,
  rollDailyEvent,
} from '@/lib/gameEvents';
import {
  ActiveRandomEvent,
  RandomEventPersistedState,
  RecoveryActionDefinition,
} from '@/types/randomEvent';

const EVENT_STORAGE_KEY = (playerId: string) =>
  `goldpenny:gameplay:event:${playerId}`;

export interface RandomEventContract {
  /** The current active event for this game day, or null if none. */
  activeEvent: ActiveRandomEvent | null;
  /** Recovery actions the player can afford right now. */
  availableRecoveryActions: RecoveryActionDefinition[];
  /**
   * Apply a recovery action by ID.
   * Marks the event as resolved and clears it from view.
   */
  applyRecoveryAction: (recoveryActionId: string) => void;
  /** Dismiss the current event without taking a recovery action. */
  dismissEvent: () => void;
}

export function useRandomEvent(
  playerId: string,
  currentGameDay: number,
  cashOnHand: number,
): RandomEventContract {
  const [activeEvent, setActiveEvent] = useState<ActiveRandomEvent | null>(null);
  // Track which day has already been processed to avoid duplicate rolls.
  const processedDayRef = useRef<number>(-1);

  useEffect(() => {
    if (!playerId || currentGameDay < 1) return;
    if (processedDayRef.current === currentGameDay) return;
    processedDayRef.current = currentGameDay;

    let cancelled = false;

    async function loadOrRoll(): Promise<void> {
      // Check AsyncStorage for a persisted event from this day.
      try {
        const raw = await AsyncStorage.getItem(EVENT_STORAGE_KEY(playerId));
        if (raw && !cancelled) {
          const persisted: RandomEventPersistedState = JSON.parse(raw);
          if (persisted.sourceDay === currentGameDay) {
            if (persisted.isResolved) {
              // Already resolved for today — respect that, no event shown.
              setActiveEvent(null);
              return;
            }
            const def = RANDOM_EVENT_POOL.find((e) => e.eventId === persisted.eventId);
            if (def) {
              setActiveEvent({ ...def, sourceDay: currentGameDay, isResolved: false });
              return;
            }
            // Unknown eventId (e.g. removed from pool) — fall through to fresh roll.
          }
          // Persisted event is from a different day — fall through to roll for today.
        }
      } catch {
        // Storage read failed — fall through to fresh roll.
      }

      if (cancelled) return;

      // Roll a new event for this day.
      const definition = rollDailyEvent(playerId, currentGameDay);
      if (definition) {
        const event: ActiveRandomEvent = {
          ...definition,
          sourceDay: currentGameDay,
          isResolved: false,
        };
        if (!cancelled) setActiveEvent(event);
        try {
          await AsyncStorage.setItem(
            EVENT_STORAGE_KEY(playerId),
            JSON.stringify({
              eventId: definition.eventId,
              sourceDay: currentGameDay,
              isResolved: false,
            } as RandomEventPersistedState),
          );
        } catch {
          // Non-critical — event remains active in memory.
        }
      } else {
        if (!cancelled) setActiveEvent(null);
        // Clear any stale persisted event from a previous day.
        try {
          await AsyncStorage.removeItem(EVENT_STORAGE_KEY(playerId));
        } catch {
          // Non-critical.
        }
      }
    }

    loadOrRoll();

    return () => {
      cancelled = true;
    };
  }, [playerId, currentGameDay]);

  // Mark the current event as resolved in both state and storage.
  const resolveEvent = useCallback(async (): Promise<void> => {
    setActiveEvent(null);
    try {
      const raw = await AsyncStorage.getItem(EVENT_STORAGE_KEY(playerId));
      if (raw) {
        const persisted: RandomEventPersistedState = JSON.parse(raw);
        await AsyncStorage.setItem(
          EVENT_STORAGE_KEY(playerId),
          JSON.stringify({ ...persisted, isResolved: true }),
        );
      }
    } catch {
      // Non-critical.
    }
  }, [playerId]);

  const applyRecoveryAction = useCallback(
    (_recoveryActionId: string): void => {
      resolveEvent();
    },
    [resolveEvent],
  );

  const dismissEvent = useCallback((): void => {
    resolveEvent();
  }, [resolveEvent]);

  const availableRecoveryActions = getAvailableRecoveryActions(cashOnHand);

  return { activeEvent, availableRecoveryActions, applyRecoveryAction, dismissEvent };
}
