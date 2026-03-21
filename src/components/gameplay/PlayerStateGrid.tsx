import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatDelta, formatHours, formatMoney } from '@/lib/gameplayFormatters';
import { EndOfDaySummaryResponse, PlayerDashboardResponse } from '@/types/gameplay';

import BusinessStatusCard from './BusinessStatusCard';
import CareerStatusCard from './CareerStatusCard';

function MiniCard({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <View style={styles.miniCard}>
      <Text style={styles.miniTitle}>{title}</Text>
      {lines.map((line, index) => (
        <Text key={`${title}_${index}`} style={styles.miniLine}>
          {line}
        </Text>
      ))}
    </View>
  );
}

export default function PlayerStateGrid({
  dashboard,
  endOfDay,
}: {
  dashboard: PlayerDashboardResponse;
  endOfDay?: EndOfDaySummaryResponse | null;
}) {
  const stats = dashboard.stats;

  return (
    <View style={styles.container}>
      <MiniCard
        title="Financial"
        lines={[
          `Cash ${formatMoney(stats.cash_xgp)}`,
          `Debt ${formatMoney(stats.debt_xgp)}`,
          `Net Worth ${formatMoney(stats.net_worth_xgp)}`,
        ]}
      />
      <MiniCard
        title="Life"
        lines={[
          `Stress ${Math.round(stats.stress)}`,
          `Health ${Math.round(stats.health)}`,
          `Daily Trend ${endOfDay ? `${formatDelta(endOfDay.stress_delta)} stress / ${formatDelta(endOfDay.health_delta)} health` : 'Waiting for next settlement'}`,
        ]}
      />
      <MiniCard
        title="Distress"
        lines={[
          `Credit ${Math.round(stats.credit_score)}`,
          `State ${endOfDay?.distress_state || 'stable'}`,
          `Warnings ${endOfDay?.tomorrow_warnings?.length || 0}`,
        ]}
      />
      <MiniCard
        title="Time Pressure"
        lines={[
          `Overtime ${formatHours(endOfDay?.debug_meta?.overtime_hours as number)}`,
          `Recovery ${formatHours(endOfDay?.debug_meta?.recovery_hours as number)}`,
          `Planning ${dashboard.recommended_actions.length} recommendations`,
        ]}
      />
      <CareerStatusCard
        input={{
          currentJob: stats.current_job,
          growthTrend: endOfDay ? (endOfDay.skill_delta >= 0 ? 'improving' : 'stalled') : 'steady',
          stressLoad: stats.stress,
          summary: 'Career momentum changes with output quality, stress load, and consistency.',
        }}
      />
      <BusinessStatusCard
        input={{
          count: Number((dashboard.debug_meta?.active_businesses as number) ?? 0),
          netProfitXgp: Number((endOfDay?.debug_meta?.business_net_xgp as number) ?? 0),
          summary: 'Business return reacts to economy, region demand, and your daily capacity.',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  miniCard: {
    flex: 1,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#ffffff',
    gap: 5,
  },
  miniTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  miniLine: {
    color: '#0f172a',
    fontSize: 13,
    lineHeight: 18,
  },
});
