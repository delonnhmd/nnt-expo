import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { motion, useReducedMotion } from '@/design/motion';
import { theme } from '@/design/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';

type PanelMode = 'sheet' | 'center';

export default function SlideUpPanel({
  visible,
  onClose,
  children,
  mode,
  contentStyle,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  mode?: PanelMode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const { isMobile } = useBreakpoint();
  const resolvedMode: PanelMode = mode || (isMobile ? 'sheet' : 'center');

  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      translate.setValue(24);
      return;
    }

    if (reduced) {
      opacity.setValue(1);
      translate.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.duration.fast,
        easing: motion.easing.standard,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: motion.duration.base,
        easing: motion.easing.emphasized,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, reduced, translate, visible]);

  const panelContainerStyle = useMemo(
    () => [
      styles.panel,
      resolvedMode === 'sheet' ? styles.sheetPanel : styles.centerPanel,
      contentStyle,
      {
        opacity,
        transform: [{ translateY: translate }],
      },
    ],
    [contentStyle, opacity, resolvedMode, translate],
  );

  const bodyStyle = resolvedMode === 'sheet' ? styles.sheetBody : styles.centerBody;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.backdropWrap}>
        <Pressable style={styles.backdropHit} onPress={onClose} />
        <View style={bodyStyle}>
          <Animated.View style={panelContainerStyle}>{children}</Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropWrap: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  backdropHit: {
    ...StyleSheet.absoluteFillObject,
  },
  centerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  sheetBody: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  panel: {
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    overflow: 'hidden',
    ...theme.shadow.lg,
  },
  centerPanel: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '90%',
    borderRadius: theme.radius.xl,
  },
  sheetPanel: {
    width: '100%',
    maxHeight: '88%',
    borderRadius: theme.radius.xl,
  },
});
