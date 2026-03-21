import React from 'react';
import { StyleSheet, View } from 'react-native';

import SurfaceCard from '@/components/ui/SurfaceCard';
import { theme } from '@/design/theme';

import SectionHeader from './SectionHeader';
import SectionSummaryRow from './SectionSummaryRow';

export default function PrimaryDashboardSection({
  title,
  summary,
  children,
  statusLabel,
}: {
  title: string;
  summary?: string | null;
  children: React.ReactNode;
  statusLabel?: string | null;
}) {
  return (
    <SurfaceCard style={styles.card}>
      <SectionHeader title={title} />
      {summary ? <SectionSummaryRow summary={summary} statusLabel={statusLabel} /> : null}
      <View style={styles.body}>{children}</View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.xs,
  },
  body: {
    gap: theme.spacing.sm,
  },
});
