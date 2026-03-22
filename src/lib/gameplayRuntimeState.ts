import {
  DailySessionStatus,
  DashboardSignalItem,
  EndOfDaySummaryResponse,
  PlayerDashboardResponse,
} from '@/types/gameplay';
import { ActiveRandomEvent } from '@/types/randomEvent';

export interface GameplayCanonicalState {
  playerId: string;
  currentDay: number;
  sessionStatus: DailySessionStatus;
  hasDashboardSnapshot: boolean;
  hasSettledEndOfDay: boolean;
  cashOnHand: number;
  debtAmount: number;
  netWorthAmount: number;
  stress: number;
  health: number;
  currentJob: string | null;
  incomeAmount: number | null;
  expenseAmount: number | null;
  netCashFlow: number | null;
  incomeSource: string | null;
  tomorrowWarnings: string[];
  topRisks: DashboardSignalItem[];
  activeEventId: string | null;
  activeEventSourceDay: number | null;
}

interface CreateGameplayCanonicalStateArgs {
  playerId: string;
  currentDay: number;
  sessionStatus: DailySessionStatus;
  dashboard: PlayerDashboardResponse | null;
  endOfDay: EndOfDaySummaryResponse | null;
}

function toNullableJob(value: unknown): string | null {
  const normalized = String(value || '').trim();
  return normalized || null;
}

export function resolveSettledEndOfDay(
  sessionStatus: DailySessionStatus,
  endOfDay: EndOfDaySummaryResponse | null,
): EndOfDaySummaryResponse | null {
  if (sessionStatus !== 'ended') return null;
  return endOfDay || null;
}

export function createGameplayCanonicalState({
  playerId,
  currentDay,
  sessionStatus,
  dashboard,
  endOfDay,
}: CreateGameplayCanonicalStateArgs): GameplayCanonicalState {
  const settledEndOfDay = resolveSettledEndOfDay(sessionStatus, endOfDay);

  return {
    playerId,
    currentDay,
    sessionStatus,
    hasDashboardSnapshot: Boolean(dashboard),
    hasSettledEndOfDay: Boolean(settledEndOfDay),
    cashOnHand: Number(dashboard?.stats.cash_xgp || 0),
    debtAmount: Number(dashboard?.stats.debt_xgp || 0),
    netWorthAmount: Number(dashboard?.stats.net_worth_xgp || 0),
    stress: Number(dashboard?.stats.stress || 0),
    health: Number(dashboard?.stats.health || 0),
    currentJob: toNullableJob(dashboard?.stats.current_job),
    incomeAmount: settledEndOfDay ? Number(settledEndOfDay.total_earned_xgp || 0) : null,
    expenseAmount: settledEndOfDay ? Number(settledEndOfDay.total_spent_xgp || 0) : null,
    netCashFlow: settledEndOfDay ? Number(settledEndOfDay.net_change_xgp || 0) : null,
    incomeSource: toNullableJob(settledEndOfDay?.biggest_gain),
    tomorrowWarnings: Array.isArray(settledEndOfDay?.tomorrow_warnings)
      ? settledEndOfDay.tomorrow_warnings
      : [],
    topRisks: Array.isArray(dashboard?.top_risks) ? dashboard.top_risks : [],
    activeEventId: null,
    activeEventSourceDay: null,
  };
}

export function attachGameplayEventState(
  state: GameplayCanonicalState,
  activeEvent: ActiveRandomEvent | null,
): GameplayCanonicalState {
  if (!activeEvent) {
    return {
      ...state,
      activeEventId: null,
      activeEventSourceDay: null,
    };
  }

  return {
    ...state,
    activeEventId: activeEvent.eventId,
    activeEventSourceDay: activeEvent.sourceDay,
  };
}