import React from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import EndOfDaySummaryCard from '@/components/gameplay/EndOfDaySummaryCard';
import EmptyStateView from '@/components/ui/EmptyStateView';
import InlineStat from '@/components/ui/InlineStat';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SectionCard from '@/components/ui/SectionCard';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { theme } from '@/design/theme';
import { formatMoney } from '@/lib/gameplayFormatters';

import { useGameplayLoop } from '../context';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

export default function SummaryScreen() {
  const loop = useGameplayLoop();

  return (
    <GameplayLoopScaffold
      title="End Of Day Summary"
      subtitle="Settle today and start tomorrow"
      activeNavKey="summary"
    >
      <SectionCard
        title="Settlement Controls"
        summary="Daily progression and settlement actions."
      >
        <InlineStat
          label="Session Status"
          value={loop.dailySession.sessionStatus === 'active' ? 'Active' : 'Ended'}
          tone={loop.dailySession.sessionStatus === 'active' ? 'info' : 'warning'}
        />
        <InlineStat
          label="Actions Taken"
          value={String(loop.dailySession.actionsTakenToday.length)}
        />
        <InlineStat
          label="Remaining Time"
          value={`${loop.dailySession.remainingTimeUnits}/${loop.dailySession.totalTimeUnits} units`}
        />
        <View style={styles.buttonRow}>
          <PrimaryButton
            label={loop.endingDay ? 'Settling Day...' : 'Run End Of Day Settlement'}
            onPress={() => {
              void loop.endCurrentDay();
            }}
            loading={loop.endingDay}
            disabled={!loop.dailyProgression.canAdvanceDay || loop.endingDay}
            style={styles.flexButton}
          />
          <SecondaryButton
            label="Go To Work"
            onPress={() => router.replace(`/gameplay/loop/${loop.playerId}/work`)}
            style={styles.flexButton}
          />
        </View>
      </SectionCard>

      {loop.endOfDaySummary ? (
        <>
          <EndOfDaySummaryCard summary={loop.endOfDaySummary} />
          <SectionCard
            title="Tomorrow"
            summary="When ready, roll into the next day loop."
          >
            <InlineStat
              label="Ending Cash"
              value={formatMoney(loop.dashboard?.stats.cash_xgp ?? 0)}
            />
            <PrimaryButton
              label="Start Next Day"
              onPress={() => {
                void loop.startNextDay();
              }}
            />
          </SectionCard>
        </>
      ) : (
        <EmptyStateView
          title="No settled summary yet"
          subtitle="Run end-of-day settlement to generate today’s recap."
        />
      )}
    </GameplayLoopScaffold>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  flexButton: {
    flex: 1,
    minWidth: 160,
  },
});
