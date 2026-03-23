import React from 'react';
import { router } from 'expo-router';

import PlayerStatsBar from '@/components/gameplay/PlayerStatsBar';
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
      footer={(
        <GameplayStickyActionArea
          summary={`Next best action: ${nextAction}`}
          secondaryLabel="Open Market"
          onSecondaryPress={() => router.replace(`/gameplay/loop/${loop.playerId}/market`)}
          primaryLabel={loop.dailySession.sessionStatus === 'active' ? 'Go To Work' : 'Open Summary'}
          onPrimaryPress={() => router.replace(`/gameplay/loop/${loop.playerId}/${loop.dailySession.sessionStatus === 'active' ? 'work' : 'summary'}`)}
        />
      )}
    >
      {stats ? (
        <GameplaySummaryCard
          eyebrow="Top-level health"
          title="Finance + Survival Snapshot"
          subtitle="This is your primary decision surface for today."
        >
          <PlayerStatsBar
            stats={stats}
            economy={loop.economyState}
            currentGameDay={loop.dailyProgression.currentGameDay}
            jobIncome={loop.jobIncome}
            expenseDebt={loop.expenseDebt}
          />
        </GameplaySummaryCard>
      ) : (
        <GameplayWarningBanner
          title="Dashboard data unavailable"
          message="Refresh to load player snapshot data from backend or fallback bundle."
          tone="info"
        />
      )}

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

      <GameplayOpportunityCallout
        title="Opportunity Signal"
        message={opportunityMessage}
      />
      <GameplayWarningBanner
        title="Pressure Signal"
        message={pressureMessage}
        tone={loop.expenseDebt.debtWarning ? 'danger' : 'warning'}
      />
    </GameplayLoopScaffold>
  );
}
