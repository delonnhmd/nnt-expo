import React from 'react';
import { StyleSheet, View } from 'react-native';

import ActionHubPanel from '@/components/gameplay/ActionHubPanel';
import ActionPreviewModal from '@/components/gameplay/ActionPreviewModal';
import { OnboardingHighlight } from '@/components/onboarding';
import EmptyStateView from '@/components/ui/EmptyStateView';
import { theme } from '@/design/theme';
import { useOnboarding } from '@/features/onboarding';

import { useGameplayLoop } from '../context';
import {
  GameplayOpportunityCallout,
  GameplayStatCard,
  GameplayStickyActionArea,
  GameplaySummaryCard,
  GameplayWarningBanner,
} from '../components/GameplayUIParts';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

export default function WorkScreen() {
  const loop = useGameplayLoop();
  const onboarding = useOnboarding();
  const guidedWorkActive = onboarding.isActive && onboarding.currentStep?.route === 'work';
  const simplified = onboarding.isSimplifiedMode;
  const stats = loop.dashboard?.stats;
  const leadTradeoff = loop.actionHub?.top_tradeoffs?.[0] || null;
  const leadWarning = loop.actionHub?.next_risk_warnings?.[0] || null;
  const endDayDisabled = !loop.dailyProgression.canAdvanceDay || loop.endingDay;
  const nextAction = loop.actionHub?.recommended_actions?.[0]?.title
    || loop.dashboard?.recommended_actions?.[0]?.title
    || 'Preview one action and execute it if the tradeoff is acceptable.';

  return (
    <GameplayLoopScaffold
      title="Work / Job"
      subtitle="Convert time into income while managing stress and health"
      activeNavKey="work"
      footer={guidedWorkActive ? null : (
        <GameplayStickyActionArea
          summary={`Time left: ${loop.dailySession.remainingTimeUnits}/${loop.dailySession.totalTimeUnits} units. Next action: ${nextAction}`}
          secondaryLabel="Open Market"
          onSecondaryPress={() => {
            onboarding.navigateTo('market');
          }}
          primaryLabel={loop.endingDay ? 'Settling Day...' : 'End Day'}
          onPrimaryPress={() => {
            void loop.endCurrentDay();
          }}
          primaryLoading={loop.endingDay}
          primaryDisabled={endDayDisabled}
        />
      )}
    >
      <GameplaySummaryCard
        eyebrow="Action framing"
        title="Work, Income, Stress, Health"
        subtitle="Check this tradeoff before spending each time unit."
      >
        <View style={styles.metricRow}>
          <GameplayStatCard
            label="Job Income"
            value={loop.jobIncome.dailyIncomeLabel}
            tone={loop.jobIncome.incomeAmount != null && loop.jobIncome.incomeAmount >= 0 ? 'positive' : 'warning'}
            note={loop.jobIncome.currentJob || 'No active job lane'}
          />
          <GameplayStatCard
            label="Stress"
            value={`${Math.round(stats?.stress ?? 0)}`}
            tone={(stats?.stress ?? 0) >= 65 ? 'danger' : 'warning'}
            note="Higher stress makes recovery and mistakes more likely."
          />
          <GameplayStatCard
            label="Health"
            value={`${Math.round(stats?.health ?? 100)}`}
            tone={(stats?.health ?? 100) >= 65 ? 'positive' : 'warning'}
            note="Health buffers bad streaks and pressure spikes."
          />
          <GameplayStatCard
            label="Time Left"
            value={`${loop.dailySession.remainingTimeUnits}/${loop.dailySession.totalTimeUnits}`}
            tone={loop.dailySession.remainingTimeUnits <= 2 ? 'warning' : 'info'}
            note="Every action consumes units."
          />
        </View>
      </GameplaySummaryCard>

      {!simplified && leadTradeoff ? (
        <GameplayOpportunityCallout
          title="Best Setup Right Now"
          message={leadTradeoff}
        />
      ) : null}
      {!simplified && leadWarning ? (
        <GameplayWarningBanner
          title="Watch Before Acting"
          message={leadWarning}
          tone="warning"
        />
      ) : null}

      {loop.actionHub ? (
        <OnboardingHighlight target="work-first-action">
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
        </OnboardingHighlight>
      ) : (
        <EmptyStateView
          title="No actions loaded"
          subtitle="Refresh to pull the latest action hub."
        />
      )}

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
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});
