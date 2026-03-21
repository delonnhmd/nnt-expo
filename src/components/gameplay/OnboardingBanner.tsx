import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { onboardingStatusLabel, onboardingStatusTone } from '@/lib/onboardingFormatters';
import { OnboardingGuidanceResponse, OnboardingStateResponse } from '@/types/onboarding';

export default function OnboardingBanner({
  state,
  guidance,
  busy,
  onAdvance,
  onSkip,
  onComplete,
}: {
  state: OnboardingStateResponse;
  guidance: OnboardingGuidanceResponse | null;
  busy?: boolean;
  onAdvance?: (actionKey?: string | null) => void;
  onSkip?: () => void;
  onComplete?: () => void;
}) {
  const status = onboardingStatusLabel(state.onboarding_status);
  const tone = onboardingStatusTone(state.onboarding_status);
  const canComplete = String(state.current_step_key || '') === 'unlock_deeper_systems';

  return (
    <View style={[styles.card, { borderColor: tone }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>First Session Guide</Text>
        <Text style={[styles.status, { color: tone }]}>{status}</Text>
      </View>

      <Text style={styles.stepTitle}>{guidance?.title || state.current_step_title}</Text>
      <Text style={styles.body}>{guidance?.body || state.current_step_body}</Text>

      {guidance?.blocker_reason ? (
        <View style={styles.blockerBox}>
          <Text style={styles.blockerText}>{guidance.blocker_reason}</Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Required:</Text>
        <Text style={styles.metaValue}>{guidance?.required_action_key || 'Continue playing'}</Text>
      </View>

      <View style={styles.actionsRow}>
        {onAdvance ? (
          <TouchableOpacity
            style={[styles.primaryButton, busy ? styles.buttonDisabled : null]}
            onPress={() => onAdvance(guidance?.required_action_key)}
            disabled={Boolean(busy)}
          >
            <Text style={styles.primaryButtonText}>Mark Step Done</Text>
          </TouchableOpacity>
        ) : null}
        {canComplete && onComplete ? (
          <TouchableOpacity
            style={[styles.secondaryButton, busy ? styles.buttonDisabled : null]}
            onPress={onComplete}
            disabled={Boolean(busy)}
          >
            <Text style={styles.secondaryButtonText}>Complete Onboarding</Text>
          </TouchableOpacity>
        ) : null}
        {guidance?.can_skip && onSkip ? (
          <TouchableOpacity
            style={[styles.skipButton, busy ? styles.buttonDisabled : null]}
            onPress={onSkip}
            disabled={Boolean(busy)}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepTitle: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  blockerBox: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 10,
  },
  blockerText: {
    color: '#7f1d1d',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  metaValue: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  primaryButton: {
    borderRadius: 9,
    backgroundColor: '#1d4ed8',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 9,
    backgroundColor: '#0f766e',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  skipButton: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
