import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { theme } from '@/design/theme';

export default function ContentStack({
  children,
  gap = theme.spacing.md,
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.stack, { gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
  },
});
