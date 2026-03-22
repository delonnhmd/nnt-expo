import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { motion, useReducedMotion } from '@/design/motion';
import { theme } from '@/design/theme';

export default function ExpandCollapseView({
  expanded,
  children,
  maxHeight = 2200,
}: {
  expanded: boolean;
  children: React.ReactNode;
  maxHeight?: number;
}) {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(expanded ? 0 : -10)).current;
  const scaleY = useRef(new Animated.Value(expanded ? 1 : 0.98)).current;

  useEffect(() => {
    if (reduced) {
      anim.setValue(expanded ? 1 : 0);
      translateY.setValue(0);
      scaleY.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(anim, {
        toValue: expanded ? 1 : 0,
        duration: motion.duration.base,
        easing: motion.easing.gentle,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: expanded ? 0 : -10,
        duration: motion.duration.base,
        easing: motion.easing.gentle,
        useNativeDriver: true,
      }),
      Animated.timing(scaleY, {
        toValue: expanded ? 1 : 0.98,
        duration: motion.duration.base,
        easing: motion.easing.standard,
        useNativeDriver: true,
      }),
    ]).start();
  }, [anim, expanded, reduced, scaleY, translateY]);

  const style = useMemo(
    () => ({
      opacity: anim,
      maxHeight: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, maxHeight],
      }),
      overflow: 'hidden' as const,
      transform: [{ translateY }, { scaleY }],
    }),
    [anim, maxHeight, scaleY, translateY],
  );

  return (
    <Animated.View style={style} pointerEvents={expanded ? 'auto' : 'none'}>
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
});
