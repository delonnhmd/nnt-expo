// Gold Penny — random event pool, recovery action pool, and generation logic.
// All event definitions live here so logic stays off UI files.

import { RandomEventDefinition, RecoveryActionDefinition } from '@/types/randomEvent';

// ─── Event pool ───────────────────────────────────────────────────────────────

export const RANDOM_EVENT_POOL: RandomEventDefinition[] = [
  {
    eventId: 'unexpected_bill',
    category: 'expense',
    title: 'Unexpected Bill',
    description: "An unplanned bill arrived — a charge you didn't budget for.",
    effectSummary: '-75 xgp cash',
    cashDelta: -75,
    expenseDelta: 0,
    debtDelta: 0,
    severity: 'medium',
  },
  {
    eventId: 'extra_shift',
    category: 'income',
    title: 'Extra Shift Bonus',
    description: 'You picked up an extra shift and earned a small bonus on top of regular income.',
    effectSummary: '+50 xgp cash',
    cashDelta: 50,
    expenseDelta: 0,
    debtDelta: 0,
    severity: 'low',
  },
  {
    eventId: 'minor_debt_fee',
    category: 'debt',
    title: 'Minor Debt Fee',
    description: 'A small processing fee was added to one of your outstanding debts.',
    effectSummary: '+30 xgp debt',
    cashDelta: 0,
    expenseDelta: 0,
    debtDelta: 30,
    severity: 'low',
  },
  {
    eventId: 'car_repair',
    category: 'expense',
    title: 'Car Repair',
    description: 'Your vehicle needed an unexpected repair today.',
    effectSummary: '-120 xgp cash',
    cashDelta: -120,
    expenseDelta: 0,
    debtDelta: 0,
    severity: 'high',
  },
  {
    eventId: 'grocery_spike',
    category: 'expense',
    title: 'Grocery Price Spike',
    description: 'Grocery prices spiked this week and caught you short.',
    effectSummary: '-25 xgp cash',
    cashDelta: -25,
    expenseDelta: 0,
    debtDelta: 0,
    severity: 'low',
  },
  {
    eventId: 'side_income_surprise',
    category: 'income',
    title: 'Side Income Surprise',
    description: 'A small unexpected windfall from a past gig came through.',
    effectSummary: '+40 xgp cash',
    cashDelta: 40,
    expenseDelta: 0,
    debtDelta: 0,
    severity: 'low',
  },
  {
    eventId: 'missed_opportunity',
    category: 'life',
    title: 'Missed Opportunity',
    description: 'Low energy today — a good opportunity slipped past you.',
    effectSummary: '-15 xgp cash',
    cashDelta: -15,
    expenseDelta: 0,
    debtDelta: 0,
    severity: 'low',
  },
  {
    eventId: 'financial_relief',
    category: 'debt',
    title: 'Financial Relief',
    description: 'A small credit or relief payment reduced your outstanding balance.',
    effectSummary: '-40 xgp debt',
    cashDelta: 0,
    expenseDelta: 0,
    debtDelta: -40,
    severity: 'low',
  },
];

// ─── Recovery action pool ─────────────────────────────────────────────────────

export const RECOVERY_ACTION_POOL: RecoveryActionDefinition[] = [
  {
    recoveryActionId: 'cut_spending',
    label: 'Cut Spending',
    effectSummary: 'Skip optional spending today. Recover +30 xgp.',
    cashCost: 0,
    cashGain: 30,
    debtReduction: 0,
    minCashRequired: 0,
  },
  {
    recoveryActionId: 'rest',
    label: 'Rest',
    effectSummary: 'Rest and recover. No immediate cash change — keeps energy up.',
    cashCost: 0,
    cashGain: 0,
    debtReduction: 0,
    minCashRequired: 0,
  },
  {
    recoveryActionId: 'debt_payment',
    label: 'Debt Payment',
    effectSummary: 'Pay 50 xgp toward debt, reducing balance by 60 xgp.',
    cashCost: 50,
    cashGain: 0,
    debtReduction: 60,
    minCashRequired: 50,
  },
  {
    recoveryActionId: 'quick_side_hustle',
    label: 'Quick Side Hustle',
    effectSummary: 'Take on a quick task and earn +45 xgp.',
    cashCost: 0,
    cashGain: 45,
    debtReduction: 0,
    minCashRequired: 0,
  },
  {
    recoveryActionId: 'skip_optional_expense',
    label: 'Skip Optional Expense',
    effectSummary: 'Skip one discretionary expense. Recover +20 xgp.',
    cashCost: 0,
    cashGain: 20,
    debtReduction: 0,
    minCashRequired: 0,
  },
];

// ─── Logic ────────────────────────────────────────────────────────────────────

/**
 * Roll a deterministic event for a given player + game day.
 * Uses a non-cryptographic hash so the same player+day always produces the same roll.
 * Returns an event (~50% of days) or null.
 *
 * The hash bit determines whether an event fires at all.
 * The upper bits pick which event from the pool.
 */
export function rollDailyEvent(
  playerId: string,
  gameDay: number,
): RandomEventDefinition | null {
  const seed = `${playerId}:${gameDay}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash * 31) + seed.charCodeAt(i)) >>> 0;
  }
  // Lowest bit determines whether an event fires (~50% chance).
  if ((hash & 1) === 0) return null;
  const index =
    ((hash >>> 1) % RANDOM_EVENT_POOL.length + RANDOM_EVENT_POOL.length) %
    RANDOM_EVENT_POOL.length;
  return RANDOM_EVENT_POOL[index];
}

/**
 * Return recovery actions the player can currently afford.
 * Actions requiring more cash than `cashOnHand` are excluded.
 */
export function getAvailableRecoveryActions(
  cashOnHand: number,
): RecoveryActionDefinition[] {
  return RECOVERY_ACTION_POOL.filter(
    (action) => cashOnHand >= action.minCashRequired,
  );
}
