import React from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import ActionHubPanel from '@/components/gameplay/ActionHubPanel';
import ActionPreviewModal from '@/components/gameplay/ActionPreviewModal';
import EmptyStateView from '@/components/ui/EmptyStateView';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SectionCard from '@/components/ui/SectionCard';
import { theme } from '@/design/theme';

import { useGameplayLoop } from '../context';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

export default function WorkScreen() {
  const loop = useGameplayLoop();

  return (
    <GameplayLoopScaffold
      title="Work / Job"
      subtitle="Run actions that move today forward"
      activeNavKey="work"
    >
      <SectionCard
        title="Work Lane"
        summary="Use preview before spending time units."
      >
        <Text style={styles.summaryText}>{loop.jobIncome.incomeSummary}</Text>
        <Text style={styles.summaryText}>
          {loop.dailySession.remainingTimeUnits}/{loop.dailySession.totalTimeUnits} units left.
        </Text>
      </SectionCard>

      {loop.actionHub ? (
        <ActionHubPanel
          hub={loop.actionHub}
          onPreviewAction={(action) => {
            void loop.openActionPreview(action);
          }}
          getExecutionGuard={(action) => loop.dailySession.canExecuteAction(action)}
          remainingTimeUnits={loop.dailySession.remainingTimeUnits}
          totalTimeUnits={loop.dailySession.totalTimeUnits}
          sessionStatus={loop.dailySession.sessionStatus}
          progressRatio={loop.dailySession.progress}
        />
      ) : (
        <EmptyStateView
          title="No actions loaded"
          subtitle="Refresh to pull the latest action hub."
        />
      )}

      <View style={styles.actionRow}>
        <PrimaryButton
          label="Open Market"
          onPress={() => router.replace(`/gameplay/loop/${loop.playerId}/market`)}
        />
        <PrimaryButton
          label={loop.endingDay ? 'Settling Day...' : 'End Day'}
          onPress={() => {
            void loop.endCurrentDay();
          }}
          loading={loop.endingDay}
          disabled={!loop.dailyProgression.canAdvanceDay || loop.endingDay}
        />
      </View>

      <ActionPreviewModal
        visible={Boolean(loop.selectedPreviewAction)}
        action={loop.selectedPreviewAction}
        preview={loop.actionPreview}
        loading={loop.previewLoading}
        error={loop.previewError}
        onClose={loop.closeActionPreview}
        onExecuteAction={() => {
          void loop.executeSelectedAction();
        }}
        executeDisabled={loop.dailySession.sessionStatus !== 'active'}
        executeGuard={loop.selectedPreviewAction ? loop.dailySession.canExecuteAction(loop.selectedPreviewAction) : undefined}
        executing={loop.executingAction}
      />
    </GameplayLoopScaffold>
  );
}

const styles = StyleSheet.create({
  summaryText: {
    ...theme.typography.bodySm,
    color: theme.color.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});
