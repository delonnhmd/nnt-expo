import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/design/theme';
import { creditTone, formatMoney, healthTone, stressTone } from '@/lib/gameplayFormatters';
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

export default function PlayerStatsBar({ stats }: { stats: DashboardStatSnapshot }) {
  return (
    <View style={styles.container}>
      <StatTile label="Cash" value={formatMoney(stats.cash_xgp)} />
      <StatTile label="Debt" value={formatMoney(stats.debt_xgp)} tone={stats.debt_xgp > 0 ? '#b91c1c' : '#166534'} />
      <StatTile label="Net Worth" value={formatMoney(stats.net_worth_xgp)} />
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
