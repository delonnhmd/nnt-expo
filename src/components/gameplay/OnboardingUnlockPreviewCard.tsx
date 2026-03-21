import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { unlockStatusLabel } from '@/lib/onboardingFormatters';
import { OnboardingUnlockScheduleResponse } from '@/types/onboarding';

export default function OnboardingUnlockPreviewCard({
  schedule,
}: {
  schedule: OnboardingUnlockScheduleResponse;
}) {
  const preview = schedule.items.slice(0, 5);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>What Unlocks Next</Text>
      {preview.length > 0 ? (
        preview.map((item) => (
          <View key={item.module_key} style={styles.row}>
            <View style={[styles.badge, item.unlock_status ? styles.badgeUnlocked : styles.badgeLocked]}>
              <Text style={[styles.badgeText, item.unlock_status ? styles.badgeTextUnlocked : styles.badgeTextLocked]}>
                {unlockStatusLabel(item.unlock_status)}
              </Text>
            </View>
            <View style={styles.copyWrap}>
              <Text style={styles.module}>{item.module_key.replace(/_/g, ' ')}</Text>
              <Text style={styles.reason}>{item.unlock_reason}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No unlocks pending.</Text>
      )}
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
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  badge: {
    marginTop: 2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  badgeUnlocked: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  badgeLocked: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  badgeTextUnlocked: {
    color: '#166534',
  },
  badgeTextLocked: {
    color: '#475569',
  },
  copyWrap: {
    flex: 1,
    gap: 2,
  },
  module: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  reason: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 16,
  },
  empty: {
    color: '#64748b',
    fontSize: 12,
  },
});
