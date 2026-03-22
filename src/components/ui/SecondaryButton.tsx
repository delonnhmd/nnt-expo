import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { theme } from '@/design/theme';

export default function SecondaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const blocked = Boolean(disabled || !onPress);

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      style={({ pressed }) => [
        styles.button,
        style,
        blocked ? styles.disabled : null,
        pressed && !blocked ? styles.pressed : null,
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    backgroundColor: theme.color.surfaceAlt,
  },
  text: {
    color: theme.color.textSecondary,
    ...theme.typography.label,
  },
});
