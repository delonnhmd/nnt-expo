import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/design/theme';
import { creditTone, formatMoney, healthTone, stressTone } from '@/lib/gameplayFormatters';
import { GameplayEconomyState } from '@/types/economy';
import { DashboardStatSnapshot } from '@/types/gameplay';

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, tone ? { color: tone } : null]}>{value}</Text>
    </View>
  );
}

export default function PlayerStatsBar({
  stats,
  economy,
}: {
  stats: DashboardStatSnapshot;
  economy?: GameplayEconomyState | null;
}) {
  const cashOnHand = economy?.cashOnHand ?? stats.cash_xgp;
  const debtAmount = economy?.debtAmount ?? stats.debt_xgp;
  const netWorthAmount = economy?.netWorthAmount ?? stats.net_worth_xgp;
  const cashFlowTone =
    economy?.netCashFlow == null
      ? theme.color.textSecondary
      : economy.netCashFlow < 0
        ? '#b91c1c'
        : economy.netCashFlow > 0
          ? '#166534'
          : theme.color.textSecondary;

  return (
    <View style={styles.container}>
      <StatTile label="Cash" value={formatMoney(cashOnHand)} />
      <StatTile label="Debt" value={formatMoney(debtAmount)} tone={debtAmount > 0 ? '#b91c1c' : '#166534'} />
      <StatTile label="Net Worth" value={formatMoney(netWorthAmount)} />
      {economy ? <StatTile label="Cash Flow" value={economy.cashFlowLabel} tone={cashFlowTone} /> : null}
      <StatTile label="Stress" value={`${Math.round(stats.stress)}`} tone={stressTone(stats.stress)} />
      <StatTile label="Health" value={`${Math.round(stats.health)}`} tone={healthTone(stats.health)} />
      <StatTile label="Credit" value={`${Math.round(stats.credit_score)}`} tone={creditTone(stats.credit_score)} />
      <StatTile label="Job" value={stats.current_job || 'Unassigned'} />
      <StatTile label="Region" value={stats.region_key || 'Unknown'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    padding: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tile: {
    minWidth: 112,
    flex: 1,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfaceAlt,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xxs,
  },
  label: {
    ...theme.typography.caption,
    color: theme.color.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  value: {
    ...theme.typography.bodySm,
    color: theme.color.textPrimary,
    fontWeight: '700',
  },
});
