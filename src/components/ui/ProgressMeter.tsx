import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/design/theme';

export default function ProgressMeter({
  progress,
  label,
}: {
  progress: number;
  label?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.meta}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
  },
  track: {
    height: 8,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  fill: {
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.accent,
  },
  meta: {
    color: theme.color.textSecondary,
    ...theme.typography.caption,
  },
});
