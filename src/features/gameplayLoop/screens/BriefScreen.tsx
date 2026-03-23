import React from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import DailyBriefCard from '@/components/gameplay/DailyBriefCard';
import InlineStat from '@/components/ui/InlineStat';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SectionCard from '@/components/ui/SectionCard';
import StatusChip from '@/components/ui/StatusChip';
import { theme } from '@/design/theme';

import { useGameplayLoop } from '../context';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

function toneForSeverity(severity: string | undefined): 'neutral' | 'warning' | 'danger' | 'success' | 'info' {
  const normalized = String(severity || '').toLowerCase();
  if (normalized === 'critical' || normalized === 'high') return 'danger';
  if (normalized === 'medium') return 'warning';
  if (normalized === 'low') return 'info';
  return 'neutral';
}

export default function BriefScreen() {
  const loop = useGameplayLoop();

  return (
    <GameplayLoopScaffold
      title="Home / Daily Brief"
      subtitle="Read today in under 2 minutes"
      activeNavKey="brief"
    >
      {loop.dashboard ? (
        <DailyBriefCard
          dashboard={loop.dashboard}
          impactBullets={[
            ...(loop.economySummary?.player_warnings || []).slice(0, 2),
            ...(loop.economySummary?.player_opportunities || []).slice(0, 1),
          ]}
        />
      ) : null}

      <SectionCard
        title="Today At A Glance"
        summary="Core loop signal check before taking action."
      >
        <InlineStat
          label="Current Day"
          value={`Day ${loop.dailyProgression.currentGameDay}`}
        />
        <InlineStat
          label="Time Available"
          value={`${loop.dailySession.remainingTimeUnits}/${loop.dailySession.totalTimeUnits} units`}
        />
        <InlineStat
          label="Session"
          value={loop.dailySession.sessionStatus === 'active' ? 'Action window open' : 'Day already settled'}
          tone={loop.dailySession.sessionStatus === 'active' ? 'positive' : 'warning'}
        />
      </SectionCard>

      <SectionCard
        title="Opportunity And Risk Indicators"
        summary="Top items from the backend snapshot."
      >
        <View style={styles.list}>
          {(loop.dashboard?.top_opportunities || []).slice(0, 2).map((item) => (
            <View key={item.key} style={styles.signalRow}>
              <StatusChip label="Opportunity" status={toneForSeverity(item.severity)} />
              <View style={styles.signalCopy}>
                <Text style={styles.signalTitle}>{item.title}</Text>
                <Text style={styles.signalBody}>{item.description}</Text>
              </View>
            </View>
          ))}
          {(loop.dashboard?.top_risks || []).slice(0, 2).map((item) => (
            <View key={item.key} style={styles.signalRow}>
              <StatusChip label="Risk" status={toneForSeverity(item.severity)} />
              <View style={styles.signalCopy}>
                <Text style={styles.signalTitle}>{item.title}</Text>
                <Text style={styles.signalBody}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </SectionCard>

      <PrimaryButton
        label="Go To Work / Job"
        onPress={() => router.replace(`/gameplay/loop/${loop.playerId}/work`)}
      />
    </GameplayLoopScaffold>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.sm,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  signalCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  signalTitle: {
    ...theme.typography.bodySm,
    color: theme.color.textPrimary,
    fontWeight: '700',
  },
  signalBody: {
    ...theme.typography.bodySm,
    color: theme.color.textSecondary,
  },
});
