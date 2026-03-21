import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingStateResponse, OnboardingUnlockScheduleResponse } from '@/types/onboarding';

function stepLabel(stepKey: string): string {
  return stepKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function FirstSessionSummaryCard({
  state,
  unlockSchedule,
}: {
  state: OnboardingStateResponse;
  unlockSchedule: OnboardingUnlockScheduleResponse | null;
}) {
  const unlockedModules = unlockSchedule?.items.filter((item) => item.unlock_status).map((item) => item.module_key) || [];
  const nextLocked = unlockSchedule?.items.find((item) => !item.unlock_status) || null;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>First Session Summary</Text>
      <Text style={styles.copy}>
        You completed {state.completed_step_keys.length} onboarding milestones. Keep this pace for a smoother week.
      </Text>

      {state.completed_step_keys.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>What You Learned</Text>
          {state.completed_step_keys.slice(0, 4).map((key) => (
            <Text key={key} style={styles.blockLine}>
              - {stepLabel(key)}
            </Text>
          ))}
        </View>
      ) : null}

      {unlockedModules.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Now Unlocked</Text>
          {unlockedModules.slice(0, 4).map((moduleKey) => (
            <Text key={moduleKey} style={styles.blockLine}>
              - {stepLabel(moduleKey)}
            </Text>
          ))}
        </View>
      ) : null}

      {nextLocked ? (
        <View style={styles.nextBlock}>
          <Text style={styles.nextTitle}>Next Focus</Text>
          <Text style={styles.nextBody}>{nextLocked.unlock_reason}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    padding: 12,
    gap: 8,
  },
  heading: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: '800',
  },
  copy: {
    color: '#1e3a8a',
    fontSize: 12,
    lineHeight: 17,
  },
  block: {
    gap: 4,
  },
  blockTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  blockLine: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 17,
  },
  nextBlock: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    padding: 10,
    gap: 4,
  },
  nextTitle: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '800',
  },
  nextBody: {
    color: '#1e3a8a',
    fontSize: 12,
    lineHeight: 17,
  },
});
