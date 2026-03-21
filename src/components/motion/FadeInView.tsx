import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

import { motion, useReducedMotion } from '@/design/motion';

export default function FadeInView({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      return;
    }

    Animated.timing(opacity, {
      toValue: 1,
      duration: motion.duration.base,
      delay,
      easing: motion.easing.standard,
      useNativeDriver: true,
    }).start();
  }, [delay, opacity, reduced]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}
