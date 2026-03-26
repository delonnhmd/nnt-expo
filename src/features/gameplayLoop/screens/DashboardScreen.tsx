import React from 'react';
import { StyleSheet, View } from 'react-native';

import { OnboardingHighlight } from '@/components/onboarding';
import { theme } from '@/design/theme';
import { useOnboarding } from '@/features/onboarding';
import { formatMoney } from '@/lib/gameplayFormatters';
import { useScreenTimer } from '@/hooks/useScreenTimer';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';

import { useGameplayLoop } from '../context';
import {
  GameplayCompactMetricRows,
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
  useScreenTimer('dashboard');
  const loop = useGameplayLoop();
  const onboarding = useOnboarding();
  const guidedDashboardActive = onboarding.isActive && onboarding.currentStep?.route === 'dashboard';
  const stats = loop.dashboard?.stats;
  const netCashFlow = loop.economyState.netCashFlow ?? 0;
  const pressureLabel = loop.expenseDebt.debtPressure.charAt(0).toUpperCase()
    + loop.expenseDebt.debtPressure.slice(1);
  const cash = stats?.cash_xgp ?? 0;
  const stress = stats?.stress ?? 0;
  const health = stats?.health ?? 100;

  return (
    <GameplayLoopScaffold
      title="Dashboard"
      subtitle="Your money, health, and what to do now"
      activeNavKey="dashboard"
      footer={guidedDashboardActive ? null : (
        <GameplayStickyActionArea
          secondaryLabel="Check Market"
          onSecondaryPress={() => onboarding.navigateTo('market')}
          primaryLabel={loop.dailySession.sessionStatus === 'active' ? 'Go To Work' : 'Open Summary'}
          onPrimaryPress={() =>
            onboarding.navigateTo(loop.dailySession.sessionStatus === 'active' ? 'work' : 'summary')
          }
        />
      )}
    >
      {/* ── Stats ── */}
      {stats ? (
        <OnboardingHighlight target="dashboard-core-stats">
          <GameplaySummaryCard eyebrow="Your status" title="Money, Health &amp; Stress">
            <GameplayCompactMetricRows
              items={[
                {
                  label: 'Cash',
                  value: formatMoney(cash),
                  tone: cash < 50 ? 'danger' : cash < 200 ? 'warning' : 'positive',
                },
                {
                  label: 'Money in / out today',
                  value: signedCurrency(netCashFlow),
                  tone: netCashFlow >= 0 ? 'positive' : 'danger',
                },
                {
                  label: 'Debt',
                  value: formatMoney(stats.debt_xgp),
                  tone: stats.debt_xgp > cash ? 'danger' : 'neutral',
                },
                {
                  label: 'Health',
                  value: `${Math.round(health)} / 100`,
                  tone: health < 40 ? 'danger' : health < 65 ? 'warning' : 'positive',
                },
                {
                  label: 'Stress',
                  value: String(Math.round(stress)),
                  tone: stress >= 75 ? 'danger' : stress >= 55 ? 'warning' : 'neutral',
                },
                {
                  label: 'Debt pressure',
                  value: pressureLabel,
                  tone: loop.expenseDebt.debtWarning ? 'danger' : 'neutral',
                },
              ]}
            />
          </GameplaySummaryCard>
        </OnboardingHighlight>
      ) : (
        <GameplayWarningBanner
          title="No dashboard data"
          message="Pull to refresh to load your player stats."
          tone="info"
        />
      )}

      {/* ── Quick actions ── */}
      <GameplaySummaryCard eyebrow="Actions" title="What can you do right now?">
        <View style={styles.actionGrid}>
          <PrimaryButton
            label="Go To Work"
            onPress={() => onboarding.navigateTo('work')}
            style={styles.actionBtn}
          />
          <SecondaryButton
            label="Eat a Meal"
            onPress={() => onboarding.navigateTo('life')}
            style={styles.actionBtn}
          />
          <SecondaryButton
            label="Check Market"
            onPress={() => onboarding.navigateTo('market')}
            style={styles.actionBtn}
          />
          <SecondaryButton
            label="Housing / Loan"
            onPress={() => onboarding.navigateTo('life')}
            style={styles.actionBtn}
          />
        </View>
      </GameplaySummaryCard>

      {/* ── Survival warnings ── */}
      {cash < 50 ? (
        <GameplayWarningBanner
          title="Almost out of money"
          message="Go to work to earn XGP, or borrow a quick loan on the Life tab to survive."
          tone="danger"
        />
      ) : null}

      {stress >= 70 ? (
        <GameplayWarningBanner
          title="Your stress is very high"
          message="Eat a meal or take a recovery block to reduce stress before it affects your health."
          tone="warning"
        />
      ) : null}
    </GameplayLoopScaffold>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minWidth: 140,
  },
});
