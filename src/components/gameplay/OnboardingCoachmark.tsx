import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { onboardingSectionLabel } from '@/lib/onboardingFormatters';

export default function OnboardingCoachmark({
  targetSection,
  message,
  onDismiss,
}: {
  targetSection: string | null | undefined;
  message?: string | null;
  onDismiss?: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Focus Next</Text>
        {onDismiss ? (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.target}>{onboardingSectionLabel(targetSection)}</Text>
      {message ? <Text style={styles.copy}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    padding: 12,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  dismissButton: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  dismissText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '700',
  },
  target: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  copy: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 17,
  },
});
