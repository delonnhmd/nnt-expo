import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatDelta, formatMoney } from '@/lib/gameplayFormatters';
import { EndOfDaySummaryResponse } from '@/types/gameplay';

function tomorrowFocus(summary: EndOfDaySummaryResponse): string {
  if (summary.tomorrow_warnings.length > 0) return summary.tomorrow_warnings[0];
  if (summary.net_change_xgp < 0) return 'Tomorrow starts on defense. Rebuild cash before taking extra risk.';
  if (summary.distress_state && String(summary.distress_state).toLowerCase() !== 'stable') {
    return 'Pressure is still active. Use tomorrow to reduce risk before pushing for growth.';
  }
  return 'You have breathing room. Protect the cash buffer first, then choose one clear growth move.';
}

export default function EndOfDaySummaryCard({ summary }: { summary: EndOfDaySummaryResponse }) {
  const guidedSummaryActive = Number(summary.guided_day_number || 0) >= 1 && Number(summary.guided_day_number || 0) <= 3;

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

      <View style={styles.storyBox}>
        <Text style={styles.storyTitle}>What changed today</Text>
        <Text style={styles.storyText}>Biggest gain: {summary.biggest_gain}</Text>
        <Text style={styles.storyText}>Biggest loss: {summary.biggest_loss}</Text>
      </View>

      {guidedSummaryActive ? (
        <View style={styles.lessonBox}>
          <Text style={styles.lessonTitle}>{summary.guided_learning_title || `Day ${summary.guided_day_number} lesson`}</Text>
          {summary.guided_earned_summary ? <Text style={styles.lessonText}>{summary.guided_earned_summary}</Text> : null}
          {summary.guided_spent_summary ? <Text style={styles.lessonText}>{summary.guided_spent_summary}</Text> : null}
          {summary.guided_change_summary ? <Text style={styles.lessonText}>{summary.guided_change_summary}</Text> : null}
        </View>
      ) : null}

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

      <View style={styles.focusBox}>
        <Text style={styles.focusTitle}>Tomorrow Focus</Text>
        <Text style={styles.focusText}>{summary.guided_watch_tomorrow || tomorrowFocus(summary)}</Text>
      </View>
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
  storyBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    gap: 4,
  },
  storyTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storyText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 17,
  },
  lessonBox: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    padding: 10,
    gap: 4,
  },
  lessonTitle: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '800',
  },
  lessonText: {
    color: '#1e3a8a',
    fontSize: 12,
    lineHeight: 17,
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
  focusBox: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    padding: 10,
    gap: 4,
  },
  focusTitle: {
    color: '#1e40af',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  focusText: {
    color: '#1e3a8a',
    fontSize: 12,
    lineHeight: 17,
  },
});
