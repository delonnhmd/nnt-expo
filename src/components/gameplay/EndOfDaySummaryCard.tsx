import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatDelta, formatMoney } from '@/lib/gameplayFormatters';
import { EndOfDaySummaryResponse } from '@/types/gameplay';

export default function EndOfDaySummaryCard({ summary }: { summary: EndOfDaySummaryResponse }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>End of Day Summary</Text>
      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Earned</Text>
          <Text style={[styles.metricValue, { color: '#166534' }]}>{formatMoney(summary.total_earned_xgp)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Spent</Text>
          <Text style={[styles.metricValue, { color: '#b91c1c' }]}>{formatMoney(summary.total_spent_xgp)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Net</Text>
          <Text style={[styles.metricValue, { color: summary.net_change_xgp >= 0 ? '#166534' : '#b91c1c' }]}>
            {formatMoney(summary.net_change_xgp)}
          </Text>
        </View>
      </View>

      <Text style={styles.copy}>Biggest Gain: {summary.biggest_gain}</Text>
      <Text style={styles.copy}>Biggest Loss: {summary.biggest_loss}</Text>
      <Text style={styles.copy}>Stress Δ: {formatDelta(summary.stress_delta)}</Text>
      <Text style={styles.copy}>Health Δ: {formatDelta(summary.health_delta)}</Text>
      <Text style={styles.copy}>Skill Δ: {formatDelta(summary.skill_delta)}</Text>
      <Text style={styles.copy}>Credit Δ: {formatDelta(summary.credit_score_delta, 0)}</Text>
      <Text style={styles.copy}>Distress: {summary.distress_state}</Text>

      {summary.tomorrow_warnings.length > 0 ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Tomorrow Warnings</Text>
          {summary.tomorrow_warnings.map((item, index) => (
            <Text key={`tomorrow_${index}`} style={styles.warningText}>
              • {item}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 8,
  },
  heading: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 3,
  },
  metricLabel: {
    color: '#64748b',
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '700',
  },
  metricValue: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
  copy: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  warningBox: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    padding: 10,
    gap: 4,
  },
  warningTitle: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  warningText: {
    color: '#7f1d1d',
    fontSize: 12,
    lineHeight: 17,
  },
});
