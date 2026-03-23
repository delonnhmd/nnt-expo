import React from 'react';
import { StyleSheet, View } from 'react-native';

import DailyBriefCard from '@/components/gameplay/DailyBriefCard';
import { OnboardingHighlight } from '@/components/onboarding';
import { theme } from '@/design/theme';
import { useOnboarding } from '@/features/onboarding';
import { formatMoney } from '@/lib/gameplayFormatters';

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

export default function BriefScreen() {
  const loop = useGameplayLoop();
  const onboarding = useOnboarding();
  const guidedBriefActive = onboarding.isActive && onboarding.currentStep?.route === 'brief';
  const simplified = onboarding.isSimplifiedMode;
  const topOpportunity = loop.dashboard?.top_opportunities?.[0];
  const topRisk = loop.dashboard?.top_risks?.[0];
  const netFlow = loop.economyState.netCashFlow ?? 0;
  const nextAction = loop.actionHub?.recommended_actions?.[0]?.title
    || loop.dashboard?.recommended_actions?.[0]?.title
    || 'Review Work lane and run one low-risk action.';
  const timeTone = loop.dailySession.remainingTimeUnits <= 2
    ? 'warning'
    : loop.dailySession.remainingTimeUnits <= 0
      ? 'danger'
      : 'info';

  return (
    <GameplayLoopScaffold
      title="Home / Daily Brief"
      subtitle="Read, orient, and decide your first move"
      activeNavKey="brief"
      footer={guidedBriefActive ? null : (
        <GameplayStickyActionArea
          summary={`Most important next action: ${nextAction}`}
          secondaryLabel="Jump To Work"
          onSecondaryPress={() => {
            onboarding.navigateTo('work');
          }}
          primaryLabel="Continue To Dashboard"
          onPrimaryPress={() => {
            onboarding.navigateTo('dashboard');
          }}
        />
      )}
    >
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

      <GameplaySummaryCard
        eyebrow="Macro chips"
        title="Economy Snapshot"
        subtitle="Fast context before committing time units."
      >
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

      {!simplified ? (
        <GameplaySummaryCard
          eyebrow="Why today matters"
          title={loop.dashboard?.headline || 'Protect downside, then grow carefully.'}
          subtitle={loop.economySummary?.explainer.this_week_focus || 'Use one deliberate action before ending the day.'}
        >
          <GameplayCompactMetricRows
            items={[
              {
                label: 'Risk pressure',
                value: topRisk?.title || loop.economySummary?.player_warnings?.[0] || 'No major risk flagged.',
                tone: 'warning',
              },
              {
                label: 'Opportunity',
                value: topOpportunity?.title || loop.economySummary?.player_opportunities?.[0] || 'No major upside flagged.',
                tone: 'positive',
              },
              {
                label: 'Next action',
                value: nextAction,
                tone: 'info',
              },
            ]}
          />
        </GameplaySummaryCard>
      ) : null}

      {!simplified && topOpportunity ? (
        <GameplayOpportunityCallout
          title="Top Opportunity"
          message={topOpportunity.description}
        />
      ) : null}

      {!simplified && topRisk ? (
        <GameplayWarningBanner
          title="Top Risk"
          message={topRisk.description}
          tone="warning"
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
