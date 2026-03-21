import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    minWidth: 100,
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  value: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
  },
});
