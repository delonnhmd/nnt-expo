import React from 'react';
import { StyleSheet, View } from 'react-native';

import DailyBriefCard from '@/components/gameplay/DailyBriefCard';
import EndOfDaySummaryCard from '@/components/gameplay/EndOfDaySummaryCard';
import { OnboardingHighlight } from '@/components/onboarding';
import EmptyStateView from '@/components/ui/EmptyStateView';
import { theme } from '@/design/theme';
import { useOnboarding } from '@/features/onboarding';
import { useScreenTimer } from '@/hooks/useScreenTimer';
import { formatDelta, formatMoney } from '@/lib/gameplayFormatters';

import { useGameplayLoop } from '../context';
import {
  GameplayCompactMetricRows,
  GameplayStickyActionArea,
  GameplaySummaryCard,
  GameplayTrendChip,
  GameplayWarningBanner,
  toneFromSignedValue,
} from '../components/GameplayUIParts';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

export default function BriefScreen() {
  useScreenTimer('brief');
  const loop = useGameplayLoop();
  const onboarding = useOnboarding();
  const guidedBriefActive = onboarding.isActive && onboarding.currentStep?.route === 'brief';
  const netFlow = loop.economyState.netCashFlow ?? 0;
  const timeTone = loop.dailySession.remainingTimeUnits <= 2
    ? 'warning'
    : loop.dailySession.remainingTimeUnits <= 0
      ? 'danger'
      : 'info';

  // End-of-day summary state
  const summary = loop.endOfDaySummary;
  const hasSummary = Boolean(summary);
  const sessionEnded = loop.dailySession.sessionStatus === 'ended';
  const summaryMissingAfterSettlement = !hasSummary && sessionEnded;
  const netTone = toneFromSignedValue(summary?.net_change_xgp ?? 0);

  // Footer logic: day active vs day ended
  const primaryLabel = hasSummary || summaryMissingAfterSettlement
    ? 'Start Next Day'
    : loop.endingDay
      ? 'Settling Day...'
      : sessionEnded
        ? 'Run Settlement'
        : 'Go To Dashboard';

  const onPrimaryPress = hasSummary || summaryMissingAfterSettlement
    ? () => void loop.startNextDay()
    : sessionEnded
      ? () => void loop.endCurrentDay()
      : () => onboarding.navigateTo('dashboard');

  return (
    <GameplayLoopScaffold
      title="Brief"
      subtitle="Day overview and settlement"
      activeNavKey="brief"
      footer={guidedBriefActive ? null : (
        <GameplayStickyActionArea
          secondaryLabel={sessionEnded ? undefined : 'Go To Dashboard'}
          onSecondaryPress={sessionEnded ? undefined : () => onboarding.navigateTo('dashboard')}
          primaryLabel={primaryLabel}
          onPrimaryPress={onPrimaryPress}
          primaryLoading={!hasSummary && !summaryMissingAfterSettlement && loop.endingDay}
          primaryDisabled={
            !hasSummary
            && !summaryMissingAfterSettlement
            && sessionEnded
            && (!loop.dailyProgression.canAdvanceDay || loop.endingDay)
          }
        />
      )}
    >
      {/* ── Daily Brief card ── */}
      {loop.dashboard ? (
        <OnboardingHighlight target="brief-daily-economy">
          <DailyBriefCard
            dashboard={loop.dashboard}
            impactBullets={[
              ...(loop.economySummary?.player_warnings || []).slice(0, 2),
              ...(loop.economySummary?.player_opportunities || []).slice(0, 1),
            ]}
          />
        </OnboardingHighlight>
      ) : null}

      {/* ── Economy snapshot ── */}
      <GameplaySummaryCard eyebrow="Economy" title="Snapshot">
        <View style={styles.chipRow}>
          <GameplayTrendChip
            label="Day"
            value={`Day ${loop.dailyProgression.currentGameDay}`}
            tone="info"
          />
          <GameplayTrendChip
            label="Time left"
            value={`${loop.dailySession.remainingTimeUnits}/${loop.dailySession.totalTimeUnits} units`}
            tone={timeTone}
          />
          <GameplayTrendChip
            label="Net flow"
            value={`${netFlow > 0 ? '+' : ''}${formatMoney(netFlow)}`}
            tone={toneFromSignedValue(netFlow)}
          />
          <GameplayTrendChip
            label="Market mood"
            value={loop.economySummary?.market_overview.current_market_mood || 'Unknown'}
            tone="neutral"
          />
        </View>
      </GameplaySummaryCard>

      {/* ── End-of-day settlement (shown once session ended) ── */}
      {sessionEnded ? (
        <OnboardingHighlight target="summary-day-results">
          <GameplaySummaryCard
            eyebrow="Day closeout"
            title="Settlement Status"
          >
            <View style={styles.chipRow}>
              <GameplayTrendChip
                label="Session"
                value="Ended"
                tone="warning"
              />
              <GameplayTrendChip
                label="Actions"
                value={String(loop.dailySession.actionsTakenToday.length)}
                tone="neutral"
              />
              <GameplayTrendChip
                label="Ending cash"
                value={formatMoney(loop.dashboard?.stats.cash_xgp ?? 0)}
                tone="neutral"
              />
            </View>
          </GameplaySummaryCard>
        </OnboardingHighlight>
      ) : null}

      {summary ? (
        <>
          <GameplaySummaryCard
            eyebrow="Today's result"
            title={summary.net_change_xgp >= 0
              ? 'Nice finish today.'
              : 'Tough day — tomorrow can recover this.'}
          >
            <GameplayCompactMetricRows
              items={[
                { label: 'Net', value: formatMoney(summary.net_change_xgp), tone: netTone },
                { label: 'Earned', value: formatMoney(summary.total_earned_xgp), tone: 'positive' },
                { label: 'Spent', value: formatMoney(summary.total_spent_xgp), tone: 'danger' },
                { label: 'Stress delta', value: formatDelta(summary.stress_delta), tone: summary.stress_delta > 0 ? 'danger' : 'positive' },
                { label: 'Health delta', value: formatDelta(summary.health_delta), tone: summary.health_delta >= 0 ? 'positive' : 'warning' },
              ]}
            />
          </GameplaySummaryCard>
          <EndOfDaySummaryCard summary={summary} />
        </>
      ) : summaryMissingAfterSettlement ? (
        <EmptyStateView
          title="Summary temporarily unavailable"
          subtitle="Settlement completed. Continue to the next day — refresh later for full recap."
        />
      ) : !sessionEnded ? (
        <GameplayWarningBanner
          title="Day still active"
          message="Run End Day from the Dashboard when you are done with your actions."
          tone="info"
        />
      ) : null}
    </GameplayLoopScaffold>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});
