import React from 'react';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/design/theme';

export default function BottomActionBar({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.bar}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
    backgroundColor: theme.color.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    ...theme.shadow.sm,
  },
});
