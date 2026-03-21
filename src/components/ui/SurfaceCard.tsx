import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { theme } from '@/design/theme';

export type SurfaceCardVariant = 'default' | 'highlighted' | 'warning' | 'muted';

function variantStyle(variant: SurfaceCardVariant): ViewStyle {
  if (variant === 'highlighted') {
    return {
      borderColor: '#bfdbfe',
      backgroundColor: '#eff6ff',
    };
  }
  if (variant === 'warning') {
    return {
      borderColor: '#fde68a',
      backgroundColor: '#fffbeb',
    };
  }
  if (variant === 'muted') {
    return {
      borderColor: '#e2e8f0',
      backgroundColor: '#f8fafc',
    };
  }
  return {
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
  };
}

export default function SurfaceCard({
  children,
  style,
  variant = 'default',
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: SurfaceCardVariant;
  padded?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        variantStyle(variant),
        padded ? styles.padded : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
  },
  padded: {
    padding: theme.spacing.md,
  },
});
