import React from 'react';

import { OnboardingHighlight } from '@/components/onboarding';
import PlayerStatsBar from '@/components/gameplay/PlayerStatsBar';
import { useOnboarding } from '@/features/onboarding';
import { formatMoney } from '@/lib/gameplayFormatters';

import { useGameplayLoop } from '../context';
import {
  GameplayCompactMetricRows,
  GameplayOpportunityCallout,
  GameplayStickyActionArea,
  GameplaySummaryCard,
  GameplayWarningBanner,
} from '../components/GameplayUIParts';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

function signedCurrency(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMoney(value)}`;
}

export default function DashboardScreen() {
  const loop = useGameplayLoop();
  const onboarding = useOnboarding();
  const guidedDashboardActive = onboarding.isActive && onboarding.currentStep?.route === 'dashboard';
  const simplified = onboarding.isSimplifiedMode;
  const stats = loop.dashboard?.stats;
  const netCashFlow = loop.economyState.netCashFlow ?? 0;
  const nextAction = loop.actionHub?.recommended_actions?.[0]?.title
    || loop.dashboard?.recommended_actions?.[0]?.title
    || 'Open Work and preview your safest move.';
  const pressureLabel = loop.expenseDebt.debtPressure.charAt(0).toUpperCase() + loop.expenseDebt.debtPressure.slice(1);
  const pressureMessage = loop.dashboard?.top_risks?.[0]?.description
    || loop.economySummary?.player_warnings?.[0]
    || 'No immediate risk headline, but keep a cash buffer before optional plays.';
  const opportunityMessage = loop.dashboard?.top_opportunities?.[0]?.description
    || loop.economySummary?.player_opportunities?.[0]
    || 'No direct upside flagged. Prioritize consistent cash generation.';

  return (
    <GameplayLoopScaffold
      title="Player Dashboard"
      subtitle="Financial health, pressure, and what to do next"
      activeNavKey="dashboard"
      footer={guidedDashboardActive ? null : (
        <GameplayStickyActionArea
          summary={`Next best action: ${nextAction}`}
          secondaryLabel="Open Market"
          onSecondaryPress={() => {
            onboarding.navigateTo('market');
          }}
          primaryLabel={loop.dailySession.sessionStatus === 'active' ? 'Go To Work' : 'Open Summary'}
          onPrimaryPress={() => {
            onboarding.navigateTo(loop.dailySession.sessionStatus === 'active' ? 'work' : 'summary');
          }}
        />
      )}
    >
      {stats ? (
        <OnboardingHighlight target="dashboard-core-stats">
          <GameplaySummaryCard
            eyebrow="Top-level health"
            title="Finance + Survival Snapshot"
            subtitle="This is your primary decision surface for today."
          >
            {simplified ? (
              <GameplayCompactMetricRows
                items={[
                  { label: 'Cash', value: formatMoney(stats.cash_xgp), tone: 'info' },
                  { label: 'Stress', value: String(Math.round(stats.stress)), tone: stats.stress >= 65 ? 'warning' : 'neutral' },
                  { label: 'Time left', value: `${loop.dailySession.remainingTimeUnits}/${loop.dailySession.totalTimeUnits} units`, tone: 'info' },
                  { label: 'Most important next action', value: nextAction, tone: 'info' },
                ]}
              />
            ) : (
              <PlayerStatsBar
                stats={stats}
                economy={loop.economyState}
                currentGameDay={loop.dailyProgression.currentGameDay}
                jobIncome={loop.jobIncome}
                expenseDebt={loop.expenseDebt}
              />
            )}
          </GameplaySummaryCard>
        </OnboardingHighlight>
      ) : (
        <GameplayWarningBanner
          title="Dashboard data unavailable"
          message="Refresh to load player snapshot data from backend or fallback bundle."
          tone="info"
        />
      )}

      {!simplified ? (
        <GameplaySummaryCard
          eyebrow="Pressure and opportunity"
          title="Today Decision Signals"
          subtitle="Read these before choosing your next action."
        >
          <GameplayCompactMetricRows
            items={[
              {
                label: 'Daily net movement',
                value: signedCurrency(netCashFlow),
                tone: netCashFlow >= 0 ? 'positive' : 'danger',
              },
              {
                label: 'Debt pressure',
                value: pressureLabel,
                tone: loop.expenseDebt.debtWarning ? 'danger' : 'warning',
              },
              {
                label: 'Actions taken',
                value: String(loop.dailySession.actionsTakenToday.length),
                tone: 'info',
              },
              {
                label: 'Remaining time',
                value: `${loop.dailySession.remainingTimeUnits}/${loop.dailySession.totalTimeUnits} units`,
                tone: 'info',
              },
              {
                label: 'Most important next action',
                value: nextAction,
                tone: 'info',
              },
            ]}
          />
        </GameplaySummaryCard>
      ) : null}

      {!simplified ? (
        <GameplayOpportunityCallout
          title="Opportunity Signal"
          message={opportunityMessage}
        />
      ) : null}
      {!simplified ? (
        <GameplayWarningBanner
          title="Pressure Signal"
          message={pressureMessage}
          tone={loop.expenseDebt.debtWarning ? 'danger' : 'warning'}
        />
      ) : null}
    </GameplayLoopScaffold>
  );
}
