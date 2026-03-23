import React, { useEffect, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { OnboardingStepOverlay } from '@/components/onboarding';
import AppShell from '@/components/layout/AppShell';
import ContentStack from '@/components/layout/ContentStack';
import PageContainer from '@/components/layout/PageContainer';
import ErrorStateView from '@/components/ui/ErrorStateView';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import SectionCard from '@/components/ui/SectionCard';
import { theme } from '@/design/theme';
import { useOnboarding } from '@/features/onboarding';
import { OnboardingRouteKey } from '@/features/onboarding/context';
import { formatMoney } from '@/lib/gameplayFormatters';

import { useGameplayLoop } from './context';
import {
  GameplayCompactMetricRows,
  GameplayOpportunityCallout,
  GameplaySummaryCard,
  GameplayTrendChip,
  GameplayWarningBanner,
  toneFromSignedValue,
} from './components/GameplayUIParts';

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

function labelFromPressure(pressure: string | undefined): string {
  const value = String(pressure || 'stable').trim();
  if (!value) return 'Stable';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function pressureTone(pressure: string | undefined): 'neutral' | 'warning' | 'danger' {
  const normalized = String(pressure || '').toLowerCase();
  if (normalized === 'critical' || normalized === 'high') return 'danger';
  if (normalized === 'medium') return 'warning';
  return 'neutral';
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
  const onboarding = useOnboarding();
  const {
    currentStep: onboardingStep,
    ensureRoute,
    isActive: onboardingActive,
    isSimplifiedMode,
    navigateTo,
  } = onboarding;
  const cash = loop.dashboard?.stats.cash_xgp ?? loop.economyState.cashOnHand ?? 0;
  const stress = Math.round(loop.dashboard?.stats.stress ?? 0);
  const netFlow = loop.economyState.netCashFlow ?? 0;
  const pressure = labelFromPressure(loop.expenseDebt.debtPressure);
  const usedUnits = Math.max(0, loop.dailySession.totalTimeUnits - loop.dailySession.remainingTimeUnits);
  const topOpportunity = loop.dashboard?.top_opportunities?.[0]?.title
    || loop.economySummary?.player_opportunities?.[0]
    || 'No immediate upside signal.';
  const topRisk = loop.dashboard?.top_risks?.[0]?.title
    || loop.economySummary?.player_warnings?.[0]
    || 'No immediate red flag.';
  const nextAction = loop.actionHub?.recommended_actions?.[0]?.title
    || loop.dashboard?.recommended_actions?.[0]?.title
    || 'Open Work and preview a low-risk action.';
  const sourceTone = loop.sourceMode === 'live' ? 'positive' : loop.sourceMode === 'mixed' ? 'warning' : 'info';
  const syncedTimeLabel = loop.lastSyncedAt
    ? new Date(loop.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Pending';

  useEffect(() => {
    ensureRoute(activeNavKey as OnboardingRouteKey);
  }, [activeNavKey, ensureRoute]);

  const bottomNavItems = useMemo(
    () => ([
      { key: 'brief', label: 'Brief' },
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'work', label: 'Work' },
      { key: 'market', label: 'Market' },
      { key: 'business', label: 'Business' },
      { key: 'summary', label: 'Summary' },
    ]
      .filter((item) => !(onboardingActive && item.key === 'business'))
      .map((item) => ({
        ...item,
        onPress: () => {
          navigateTo(item.key as OnboardingRouteKey);
        },
      }))),
    [navigateTo, onboardingActive],
  );

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
      bottomNavItems={bottomNavItems}
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
            {onboardingActive ? <OnboardingStepOverlay /> : null}

            {isSimplifiedMode ? (
              <GameplaySummaryCard
                eyebrow="Day 1 Essentials"
                title="Focus Right Now"
                subtitle={onboardingStep?.body || 'Take one guided step at a time.'}
              >
                <View style={styles.scanCardRow}>
                  <View style={styles.scanCard}>
                    <Text style={styles.scanLabel}>Cash</Text>
                    <Text style={styles.scanValue}>{formatMoney(cash)}</Text>
                  </View>
                  <View style={styles.scanCard}>
                    <Text style={styles.scanLabel}>Stress</Text>
                    <Text style={styles.scanValue}>{String(stress)}</Text>
                  </View>
                  <View style={styles.scanCard}>
                    <Text style={styles.scanLabel}>Time Left</Text>
                    <Text style={styles.scanValue}>{`${loop.dailySession.remainingTimeUnits}/${loop.dailySession.totalTimeUnits}`}</Text>
                  </View>
                </View>
                <GameplayCompactMetricRows
                  items={[
                    { label: 'Current step', value: onboardingStep?.title || 'Guided flow', tone: 'info' },
                    { label: 'Next move', value: nextAction, tone: 'info' },
                  ]}
                />
              </GameplaySummaryCard>
            ) : (
              <GameplaySummaryCard
                eyebrow="5-second read"
                title="Today At A Glance"
                subtitle="Financial status, pressure, opportunity, movement, and next step."
              >
                <View style={styles.scanCardRow}>
                  <View style={styles.scanCard}>
                    <Text style={styles.scanLabel}>Cash</Text>
                    <Text style={styles.scanValue}>{formatMoney(cash)}</Text>
                  </View>
                  <View style={styles.scanCard}>
                    <Text style={styles.scanLabel}>Daily Net</Text>
                    <Text style={[
                      styles.scanValue,
                      { color: toneFromSignedValue(netFlow) === 'positive' ? '#166534' : toneFromSignedValue(netFlow) === 'danger' ? '#b91c1c' : theme.color.textPrimary },
                    ]}
                    >
                      {`${netFlow > 0 ? '+' : ''}${formatMoney(netFlow)}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.trendRow}>
                  <GameplayTrendChip label="Pressure" value={pressure} tone={pressureTone(loop.expenseDebt.debtPressure)} />
                  <GameplayTrendChip
                    label="Day Movement"
                    value={`${usedUnits}/${loop.dailySession.totalTimeUnits} units used`}
                    tone="info"
                  />
                  <GameplayTrendChip label="Data" value={sourceLabel(loop.sourceMode)} tone={sourceTone} />
                </View>
                <GameplayCompactMetricRows
                  items={[
                    { label: 'Most important next action', value: nextAction, tone: 'info' },
                    { label: 'Top risk', value: topRisk, tone: 'warning' },
                    { label: 'Top opportunity', value: topOpportunity, tone: 'positive' },
                    { label: 'Last sync', value: syncedTimeLabel },
                  ]}
                />
              </GameplaySummaryCard>
            )}

            {!isSimplifiedMode && loop.sourceMode !== 'live' ? (
              <GameplayWarningBanner
                title={sourceLabel(loop.sourceMode)}
                message={sourceCopy(loop.sourceMode)}
                tone={loop.sourceMode === 'mixed' ? 'warning' : 'info'}
              />
            ) : null}

            {loop.feedback ? (
              loop.feedback.tone === 'success' ? (
                <GameplayOpportunityCallout title="Action Update" message={loop.feedback.message} />
              ) : (
                <GameplayWarningBanner
                  title={loop.feedback.tone === 'error' ? 'Needs Attention' : 'Gameplay Note'}
                  message={loop.feedback.message}
                  tone={loop.feedback.tone === 'error' ? 'danger' : 'info'}
                />
              )
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
  scanCardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  scanCard: {
    flex: 1,
    minWidth: 134,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceAlt,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xxs,
  },
  scanLabel: {
    ...theme.typography.caption,
    textTransform: 'uppercase',
    color: theme.color.textSecondary,
    fontWeight: '800',
  },
  scanValue: {
    ...theme.typography.bodyMd,
    color: theme.color.textPrimary,
    fontWeight: '800',
  },
  trendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});
