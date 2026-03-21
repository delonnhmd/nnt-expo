import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { onboardingProgressRatio } from '@/lib/onboardingFormatters';
import { OnboardingStateResponse } from '@/types/onboarding';

export default function OnboardingProgressCard({
  state,
}: {
  state: OnboardingStateResponse;
}) {
  const ratio = onboardingProgressRatio(state.progress_label);
  const pct = Math.round(ratio * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Onboarding Progress</Text>
      <Text style={styles.meta}>{state.progress_label}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.stepTitle}>Current: {state.current_step_title}</Text>
      <Text style={styles.stepBody}>{state.current_step_body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 8,
  },
  heading: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  meta: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1d4ed8',
  },
  stepTitle: {
    color: '#1e293b',
    fontSize: 13,
    fontWeight: '700',
  },
  stepBody: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
});
