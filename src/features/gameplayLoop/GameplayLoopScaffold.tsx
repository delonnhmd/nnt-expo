import React from 'react';
import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppShell from '@/components/layout/AppShell';
import ContentStack from '@/components/layout/ContentStack';
import PageContainer from '@/components/layout/PageContainer';
import ErrorStateView from '@/components/ui/ErrorStateView';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import SectionCard from '@/components/ui/SectionCard';
import { theme } from '@/design/theme';

import { useGameplayLoop } from './context';

function sourceLabel(mode: 'live' | 'mixed' | 'mock'): string {
  if (mode === 'mock') return 'Mock Data Mode';
  if (mode === 'mixed') return 'Mixed Data Mode';
  return 'Live Data Mode';
}

function sourceCopy(mode: 'live' | 'mixed' | 'mock'): string {
  if (mode === 'mock') {
    return 'Backend is unavailable right now. Local mock data is active so the gameplay loop remains playable.';
  }
  if (mode === 'mixed') {
    return 'Some sections are using local fallback data while backend endpoints recover.';
  }
  return 'Connected to backend source of truth.';
}

export default function GameplayLoopScaffold({
  title,
  subtitle,
  activeNavKey,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  activeNavKey: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const loop = useGameplayLoop();
  const navRoot = `/gameplay/loop/${loop.playerId}`;

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      headerRight={(
        <SecondaryButton
          label={loop.refreshing ? 'Refreshing...' : 'Refresh'}
          onPress={() => void loop.refresh()}
          disabled={loop.refreshing}
        />
      )}
      bottomNavItems={[
        { key: 'brief', label: 'Brief', onPress: () => router.replace(`${navRoot}/brief`) },
        { key: 'dashboard', label: 'Dashboard', onPress: () => router.replace(`${navRoot}/dashboard`) },
        { key: 'work', label: 'Work', onPress: () => router.replace(`${navRoot}/work`) },
        { key: 'market', label: 'Market', onPress: () => router.replace(`${navRoot}/market`) },
        { key: 'business', label: 'Business', onPress: () => router.replace(`${navRoot}/business`) },
        { key: 'summary', label: 'Summary', onPress: () => router.replace(`${navRoot}/summary`) },
      ]}
      activeBottomNavKey={activeNavKey}
      footer={footer}
    >
      <PageContainer>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={(
            <RefreshControl
              refreshing={loop.refreshing}
              onRefresh={() => {
                void loop.refresh();
              }}
            />
          )}
        >
          <ContentStack gap={theme.spacing.md}>
            <View style={[
              styles.sourceBanner,
              loop.sourceMode === 'live'
                ? styles.sourceLive
                : loop.sourceMode === 'mixed'
                  ? styles.sourceMixed
                  : styles.sourceMock,
            ]}>
              <Text style={styles.sourceTitle}>{sourceLabel(loop.sourceMode)}</Text>
              <Text style={styles.sourceText}>{sourceCopy(loop.sourceMode)}</Text>
            </View>

            {loop.feedback ? (
              <View style={[
                styles.feedbackBanner,
                loop.feedback.tone === 'success'
                  ? styles.feedbackSuccess
                  : loop.feedback.tone === 'error'
                    ? styles.feedbackError
                    : styles.feedbackInfo,
              ]}>
                <Text style={styles.feedbackLabel}>
                  {loop.feedback.tone === 'success' ? 'Action Update' : loop.feedback.tone === 'error' ? 'Needs Attention' : 'Gameplay Note'}
                </Text>
                <Text style={styles.feedbackText}>{loop.feedback.message}</Text>
              </View>
            ) : null}

            {loop.error && !loop.bundle ? (
              <ErrorStateView
                title="Gameplay loop unavailable"
                message={loop.error}
                onRetry={() => {
                  void loop.refresh();
                }}
              />
            ) : null}

            {!loop.bundle && loop.loading ? (
              <SectionCard
                title="Loading gameplay loop"
                summary="Syncing dashboard, economy, market, and business state."
              >
                <LoadingSkeleton lines={4} />
              </SectionCard>
            ) : (
              children
            )}
          </ContentStack>
        </ScrollView>
      </PageContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  sourceBanner: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xxs,
  },
  sourceLive: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  sourceMixed: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  sourceMock: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  sourceTitle: {
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  sourceText: {
    ...theme.typography.bodySm,
    color: '#1e3a8a',
  },
  feedbackBanner: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xxs,
  },
  feedbackSuccess: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  feedbackError: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  feedbackInfo: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  feedbackLabel: {
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
    color: theme.color.textSecondary,
  },
  feedbackText: {
    ...theme.typography.bodySm,
    color: theme.color.textPrimary,
    fontWeight: '600',
  },
});
