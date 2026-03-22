import { useMemo } from 'react';

import { formatMoney } from '@/lib/gameplayFormatters';
import { GameplayCanonicalState } from '@/lib/gameplayRuntimeState';
import { DebtPressureLevel, EconomyStatus, GameplayEconomyState } from '@/types/economy';

const DEFAULT_ECONOMY_STATE: GameplayEconomyState = {
  cashOnHand: 0,
  incomeAmount: null,
  expenseAmount: null,
  debtAmount: 0,
  netWorthAmount: 0,
  netCashFlow: null,
  debtPressure: 'low',
  economyStatus: 'stable',
  economyWarnings: [],
  cashFlowLabel: 'Pending',
  statusLabel: 'Stable',
  summaryLine: 'Cash 0.00 xgp. Cash flow pending. Debt pressure low.',
};

function toLabel(value: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) return 'Unknown';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function describeSignal(input: { title?: string; description?: string } | null | undefined): string | null {
  if (!input) return null;
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim();
  return title || description || null;
}

function deriveDebtPressure(cashOnHand: number, debtAmount: number, netWorthAmount: number): DebtPressureLevel {
  if (debtAmount <= 0) return 'low';
  if (cashOnHand <= 0 || netWorthAmount < 0) return 'critical';

  const debtToCashRatio = debtAmount / Math.max(cashOnHand, 1);
  if (debtToCashRatio >= 2) return 'critical';
  if (debtToCashRatio >= 1) return 'high';
  if (debtToCashRatio >= 0.4) return 'moderate';
  return 'low';
}

function deriveEconomyStatus(
  debtPressure: DebtPressureLevel,
  netCashFlow: number | null,
  stress: number,
  health: number,
): EconomyStatus {
  if (debtPressure === 'critical' || stress >= 80 || health <= 30) return 'critical';
  if (debtPressure === 'high' || (netCashFlow ?? 0) < 0 || stress >= 60 || health <= 45) return 'strained';
  if (debtPressure === 'moderate' || stress >= 45 || health <= 60) return 'watch';
  return 'stable';
}

function deriveWarnings(
  state: GameplayCanonicalState,
  debtPressure: DebtPressureLevel,
  netCashFlow: number | null,
): string[] {
  const warnings: string[] = [];

  if (debtPressure === 'critical') {
    warnings.push('Debt pressure is critical and needs immediate attention.');
  } else if (debtPressure === 'high') {
    warnings.push('Debt payments are putting heavy pressure on available cash.');
  } else if (debtPressure === 'moderate') {
    warnings.push('Debt pressure is rising and should be monitored closely.');
  }

  if (netCashFlow != null && netCashFlow < 0) {
    warnings.push('Current cash flow is negative after today\'s settlement.');
  }

  for (const signal of state.topRisks) {
    const next = describeSignal(signal);
    if (next && !warnings.includes(next)) warnings.push(next);
    if (warnings.length >= 3) break;
  }

  return warnings;
}

export function deriveGameplayEconomyState(
  state: GameplayCanonicalState,
): GameplayEconomyState {
  if (!state.hasDashboardSnapshot) return DEFAULT_ECONOMY_STATE;

  const cashOnHand = state.cashOnHand;
  const debtAmount = state.debtAmount;
  const netWorthAmount = state.netWorthAmount;
  const incomeAmount = state.incomeAmount;
  const expenseAmount = state.expenseAmount;
  const netCashFlow = state.netCashFlow;
  const debtPressure = deriveDebtPressure(cashOnHand, debtAmount, netWorthAmount);
  const economyStatus = deriveEconomyStatus(
    debtPressure,
    netCashFlow,
    state.stress,
    state.health,
  );
  const economyWarnings = deriveWarnings(state, debtPressure, netCashFlow);
  const cashFlowLabel = netCashFlow == null ? 'Pending' : `${netCashFlow > 0 ? '+' : ''}${formatMoney(netCashFlow)}`;
  const summaryLine = [
    `Cash ${formatMoney(cashOnHand)}`,
    netCashFlow == null ? 'Cash flow pending' : `Cash flow ${cashFlowLabel}`,
    `Debt pressure ${debtPressure}`,
  ].join('. ') + '.';

  return {
    cashOnHand,
    incomeAmount,
    expenseAmount,
    debtAmount,
    netWorthAmount,
    netCashFlow,
    debtPressure,
    economyStatus,
    economyWarnings,
    cashFlowLabel,
    statusLabel: toLabel(economyStatus),
    summaryLine,
  };
}

export function useEconomyState(
  state: GameplayCanonicalState,
): GameplayEconomyState {
  return useMemo(() => deriveGameplayEconomyState(state), [state]);
}