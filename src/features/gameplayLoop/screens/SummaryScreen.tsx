import React from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import EndOfDaySummaryCard from '@/components/gameplay/EndOfDaySummaryCard';
import EmptyStateView from '@/components/ui/EmptyStateView';
import { theme } from '@/design/theme';
import { formatDelta, formatMoney } from '@/lib/gameplayFormatters';

import { useGameplayLoop } from '../context';
import {
  GameplayCompactMetricRows,
  GameplayOpportunityCallout,
  GameplayStickyActionArea,
  GameplaySummaryCard,
  GameplayTrendChip,
  GameplayWarningBanner,
  toneFromSignedValue,
} from '../components/GameplayUIParts';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

export default function SummaryScreen() {
  const loop = useGameplayLoop();
  const summary = loop.endOfDaySummary;
  const hasSummary = Boolean(summary);
  const netTone = toneFromSignedValue(summary?.net_change_xgp ?? 0);
  const payoffTitle = summary
    ? summary.net_change_xgp >= 0
      ? 'Nice finish today. Protect momentum tomorrow.'
      : 'Tough day. Tomorrow can still recover this.'
    : 'Settle the day to unlock today\'s payoff screen.';
  const winsLine = summary?.biggest_gain || 'No biggest gain recorded yet.';
  const lossLine = summary?.biggest_loss || 'No biggest loss recorded yet.';

  return (
    <GameplayLoopScaffold
      title="End Of Day Summary"
      subtitle="Close today, read changes, and set up tomorrow"
      activeNavKey="summary"
      footer={(
        <GameplayStickyActionArea
          summary={hasSummary
            ? `Tomorrow setup: ${summary?.guided_watch_tomorrow || summary?.tomorrow_warnings?.[0] || 'Start with one low-risk income action.'}`
            : `Session ${loop.dailySession.sessionStatus}. Run settlement to generate today's recap.`}
          secondaryLabel={hasSummary ? 'Open Dashboard' : 'Go To Work'}
          onSecondaryPress={() => router.replace(`/gameplay/loop/${loop.playerId}/${hasSummary ? 'dashboard' : 'work'}`)}
          primaryLabel={hasSummary ? 'Start Next Day' : loop.endingDay ? 'Settling Day...' : 'Run End Of Day Settlement'}
          onPrimaryPress={hasSummary
            ? () => {
              void loop.startNextDay();
            }
            : () => {
              void loop.endCurrentDay();
            }}
          primaryLoading={!hasSummary && loop.endingDay}
          primaryDisabled={!hasSummary && (!loop.dailyProgression.canAdvanceDay || loop.endingDay)}
        />
      )}
    >
      <GameplaySummaryCard
        eyebrow="Settlement controls"
        title="Closeout Status"
        subtitle="Run settlement after your actions are done for the day."
      >
        <View style={styles.chipRow}>
          <GameplayTrendChip
            label="Session"
            value={loop.dailySession.sessionStatus === 'active' ? 'Active' : 'Ended'}
            tone={loop.dailySession.sessionStatus === 'active' ? 'info' : 'warning'}
          />
          <GameplayTrendChip
            label="Actions"
            value={String(loop.dailySession.actionsTakenToday.length)}
            tone="neutral"
          />
          <GameplayTrendChip
            label="Time left"
            value={`${loop.dailySession.remainingTimeUnits}/${loop.dailySession.totalTimeUnits}`}
            tone={loop.dailySession.remainingTimeUnits <= 2 ? 'warning' : 'info'}
          />
          <GameplayTrendChip
            label="Ending cash"
            value={formatMoney(loop.dashboard?.stats.cash_xgp ?? 0)}
            tone="neutral"
          />
        </View>
      </GameplaySummaryCard>

      {summary ? (
        <>
          <GameplaySummaryCard
            eyebrow="Emotional payoff"
            title={payoffTitle}
            subtitle="What changed today and what tomorrow needs."
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

          <GameplayOpportunityCallout
            title="Today Win"
            message={winsLine}
          />
          <GameplayWarningBanner
            title="Today Loss"
            message={lossLine}
            tone="warning"
          />

          <EndOfDaySummaryCard summary={summary} />
        </>
      ) : (
        <EmptyStateView
          title="No settled summary yet"
          subtitle="Run end-of-day settlement to generate today's recap."
        />
      )}
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

