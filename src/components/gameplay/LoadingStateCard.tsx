import React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import SurfaceCard from '@/components/ui/SurfaceCard';
import { theme } from '@/design/theme';

export default function LoadingStateCard({ label = 'Loading...' }: { label?: string }) {
  return (
    <SurfaceCard variant="muted" style={styles.card}>
      <ActivityIndicator size="small" color="#1d4ed8" />
      <Text style={styles.label}>{label}</Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.color.textSecondary,
    ...theme.typography.bodyMd,
    fontWeight: '600',
  },
});
