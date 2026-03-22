import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { actionStatusColor, confidenceLabel } from '@/lib/gameplayFormatters';
import { DailyActionItem } from '@/types/gameplay';
import { ActionExecutionGuard } from '@/hooks/useDailySession';

export default function ActionCard({
  action,
  onPreview,
  executionGuard,
}: {
  action: DailyActionItem;
  onPreview: (action: DailyActionItem) => void;
  executionGuard: ActionExecutionGuard;
}) {
  const statusColor = actionStatusColor(action.status);
  const previewDisabled = !executionGuard.allowed;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{action.title}</Text>
        <View style={[styles.badge, { borderColor: statusColor }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{action.status}</Text>
        </View>
      </View>

      <Text style={styles.description}>{action.description}</Text>
      {action.blocker_text ? <Text style={styles.blocker}>Blocked: {action.blocker_text}</Text> : null}
      {!action.blocker_text && !executionGuard.allowed && executionGuard.reason ? (
        <Text style={styles.blocker}>Blocked: {executionGuard.reason}</Text>
      ) : null}
      <Text style={styles.meta}>Time Cost: {executionGuard.timeCostUnits} units</Text>

      {action.tradeoffs && action.tradeoffs.length > 0 ? (
        <Text style={styles.meta}>Tradeoff: {action.tradeoffs.slice(0, 2).join(' | ')}</Text>
      ) : null}
      {action.warnings && action.warnings.length > 0 ? (
        <Text style={styles.meta}>Warning: {action.warnings.slice(0, 2).join(' | ')}</Text>
      ) : null}
      <Text style={styles.meta}>{confidenceLabel(action.confidence_level)}</Text>

      <TouchableOpacity
        onPress={() => onPreview(action)}
        disabled={previewDisabled}
        style={[styles.button, previewDisabled ? styles.buttonDisabled : null]}
      >
        <Text style={styles.buttonText}>Preview</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
  },
  badgeText: {
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  blocker: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  meta: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    marginTop: 4,
    alignSelf: 'flex-start',
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
