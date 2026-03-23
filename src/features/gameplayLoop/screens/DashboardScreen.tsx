import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import InlineStat from '@/components/ui/InlineStat';
import SectionCard from '@/components/ui/SectionCard';
import StatusChip from '@/components/ui/StatusChip';
import { theme } from '@/design/theme';
import { creditTone, formatMoney, healthTone, stressTone } from '@/lib/gameplayFormatters';

import { useGameplayLoop } from '../context';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

function signedCurrency(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMoney(value)}`;
}

export default function DashboardScreen() {
  const loop = useGameplayLoop();
  const stats = loop.dashboard?.stats;

  const cash = stats?.cash_xgp ?? 0;
  const debt = stats?.debt_xgp ?? 0;
  const netWorth = stats?.net_worth_xgp ?? 0;
  const savings = Math.max(0, Number((cash * 0.35).toFixed(2)));
  const stress = Math.round(stats?.stress ?? 0);
  const health = Math.round(stats?.health ?? 100);
  const credit = Math.round(stats?.credit_score ?? 650);
  const netCashFlow = loop.economyState.netCashFlow ?? 0;

  return (
    <GameplayLoopScaffold
      title="Player Dashboard"
      subtitle="Financial and survival state"
      activeNavKey="dashboard"
    >
      <SectionCard
        title="Finance Snapshot"
        summary="Backend-driven core system values."
      >
        <InlineStat label="Cash" value={formatMoney(cash)} tone={cash >= 0 ? 'positive' : 'danger'} />
        <InlineStat label="Savings (buffer est.)" value={formatMoney(savings)} tone="info" />
        <InlineStat label="Debt" value={formatMoney(debt)} tone={debt > 0 ? 'danger' : 'positive'} />
        <InlineStat label="Credit Score" value={String(credit)} tone={credit >= 670 ? 'positive' : 'warning'} />
        <InlineStat label="Net Worth" value={signedCurrency(netWorth)} tone={netWorth >= 0 ? 'positive' : 'danger'} />
        <InlineStat
          label="Daily Net Flow"
          value={signedCurrency(netCashFlow)}
          tone={netCashFlow >= 0 ? 'positive' : 'danger'}
        />
      </SectionCard>

      <SectionCard
        title="Condition And Time"
        summary="Health, stress, and current action window."
      >
        <InlineStat label="Health" value={`${health}`} tone={health >= 65 ? 'positive' : 'warning'} />
        <InlineStat label="Stress" value={`${stress}`} tone={stress >= 65 ? 'danger' : 'warning'} />
        <InlineStat
          label="Available Time"
          value={`${loop.dailySession.remainingTimeUnits}/${loop.dailySession.totalTimeUnits} units`}
          tone="info"
        />
        <View style={styles.toneRow}>
          <Text style={[styles.toneLabel, { color: healthTone(health) }]}>Health Tone Active</Text>
          <Text style={[styles.toneLabel, { color: stressTone(stress) }]}>Stress Tone Active</Text>
          <Text style={[styles.toneLabel, { color: creditTone(credit) }]}>Credit Tone Active</Text>
        </View>
      </SectionCard>

      <SectionCard
        title="Job State"
        summary="Income reliability and pressure for today."
      >
        <InlineStat label="Current Job" value={loop.jobIncome.currentJob || 'Unassigned'} />
        <InlineStat
          label="Job Income"
          value={loop.jobIncome.dailyIncomeLabel}
          tone={loop.jobIncome.incomeAmount == null ? 'warning' : loop.jobIncome.incomeAmount >= 0 ? 'positive' : 'danger'}
        />
        <InlineStat
          label="Stability"
          value={loop.jobIncome.workStatus === 'working' ? 'Stable lane open' : 'No stable lane'}
          tone={loop.jobIncome.workStatus === 'working' ? 'positive' : 'warning'}
        />
        <InlineStat
          label="Pressure"
          value={loop.expenseDebt.debtPressure}
          tone={loop.expenseDebt.debtWarning ? 'danger' : 'warning'}
        />
        <Text style={styles.summaryText}>{loop.jobIncome.incomeSummary}</Text>
      </SectionCard>

      <SectionCard
        title="Opportunity And Risk"
        summary="Primary backend indicators for this day."
      >
        <View style={styles.signalRow}>
          <StatusChip label="Opportunity" status="success" />
          <Text style={styles.signalText}>{loop.dashboard?.top_opportunities?.[0]?.title || 'No immediate opportunity flagged.'}</Text>
        </View>
        <View style={styles.signalRow}>
          <StatusChip label="Risk" status="danger" />
          <Text style={styles.signalText}>{loop.dashboard?.top_risks?.[0]?.title || 'No immediate risk flagged.'}</Text>
        </View>
      </SectionCard>
    </GameplayLoopScaffold>
  );
}

const styles = StyleSheet.create({
  toneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  toneLabel: {
    ...theme.typography.caption,
    fontWeight: '800',
  },
  summaryText: {
    ...theme.typography.bodySm,
    color: theme.color.textSecondary,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  signalText: {
    flex: 1,
    ...theme.typography.bodySm,
    color: theme.color.textPrimary,
  },
});
