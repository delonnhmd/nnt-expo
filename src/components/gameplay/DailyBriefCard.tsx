import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import HighlightOnChangeView from '@/components/motion/HighlightOnChangeView';
import { theme } from '@/design/theme';
import { PlayerDashboardResponse } from '@/types/gameplay';

function firstMeaningfulLine(value: string | null | undefined): string {
  return String(value || '')
    .split(/(?<=[.!?])\s+/)
    .map((entry) => entry.trim())
    .find(Boolean) || 'No summary available.';
}

export default function DailyBriefCard({
  dashboard,
}: {
  dashboard: PlayerDashboardResponse;
}) {
  const summary = firstMeaningfulLine(dashboard.daily_brief);
  const heroWatchValue = `${dashboard.headline || ''}|${summary}`;

  return (
    <View style={styles.card}>
      <HighlightOnChangeView watchValue={heroWatchValue} style={styles.heroBlock}>
        <Text style={styles.headerLabel}>Daily Brief</Text>
        <Text style={styles.headline}>{dashboard.headline || 'Today at Gold Penny'}</Text>
        <Text style={styles.summary}>{summary}</Text>
      </HighlightOnChangeView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#d6e1f2',
    borderRadius: theme.radius.xl,
    backgroundColor: '#fdfefe',
    padding: theme.spacing.lg,
  },
  heroBlock: {
    gap: theme.spacing.xs,
  },
  headerLabel: {
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#1d4ed8',
    fontWeight: '800',
  },
  headline: {
    ...theme.typography.headingLg,
    color: theme.color.textPrimary,
    fontWeight: '800',
  },
  summary: {
    color: theme.color.textSecondary,
    ...theme.typography.bodyMd,
    lineHeight: 20,
  },
});

  const recommendedActions = (dashboard.recommended_actions || []).filter(Boolean).slice(0, 2);
  const leadRisk = dashboard.top_risks[0] || null;
  const leadOpportunity = dashboard.top_opportunities[0] || null;
  const primarySignal = leadRisk || leadOpportunity;
  const secondarySignal = leadRisk && leadOpportunity
    ? leadOpportunity
    : dashboard.top_risks[1] || dashboard.top_opportunities[1] || null;
  const summary = firstMeaningfulLine(dashboard.daily_brief);
  const heroWatchValue = `${dashboard.headline || ''}|${summary}`;
  const primarySignalWatchValue = `${primarySignal?.title || ''}|${primarySignal?.description || ''}`;
  const secondarySignalWatchValue = `${secondarySignal?.title || ''}|${secondarySignal?.description || ''}`;

  return (
    <View style={styles.card}>
      <HighlightOnChangeView watchValue={heroWatchValue} style={styles.heroBlock}>
        <Text style={styles.headerLabel}>Daily Brief</Text>
        <Text style={styles.headline}>{dashboard.headline || 'Today at Gold Penny'}</Text>
        <Text style={styles.summary} numberOfLines={3}>{summary}</Text>
      </HighlightOnChangeView>

      {primarySignal ? (
        <HighlightOnChangeView
          watchValue={primarySignalWatchValue}
          style={[styles.primarySignalBox, leadRisk ? styles.primarySignalRisk : styles.primarySignalOpportunity]}
        >
          <Text style={styles.primarySignalLabel}>{leadRisk ? 'Watch now' : 'Best opening'}</Text>
          <Text style={styles.primarySignalTitle} numberOfLines={2}>{primarySignal.title}</Text>
          <Text style={styles.primarySignalText} numberOfLines={2}>{primarySignal.description}</Text>
        </HighlightOnChangeView>
      ) : null}

      <View style={styles.bottomGrid}>
        <View style={styles.quickActionBox}>
          <Text style={styles.quickActionTitle}>Best next move</Text>
          {recommendedActions.length > 0 ? (
            recommendedActions.map((action, index) => (
              <View key={`${action.action_key}_${index}`} style={styles.quickActionItem}>
                <Text style={styles.quickActionIndex}>0{index + 1}</Text>
                <View style={styles.quickActionCopy}>
                  <Text style={styles.quickActionName} numberOfLines={1}>{action.title}</Text>
                  <Text style={styles.quickActionReason} numberOfLines={2}>
                    {action.reason || 'Review this action in the hub.'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.neutralBody}>
              No direct move is flagged. Protect cash first, then choose the lowest-risk action that improves tomorrow.
            </Text>
          )}
        </View>

        <HighlightOnChangeView watchValue={secondarySignalWatchValue || 'brief-status'} style={styles.secondarySignalBox}>
          <Text style={styles.secondarySignalTitle}>{secondarySignal ? 'Secondary signal' : 'Brief status'}</Text>
          {secondarySignal ? (
            <>
              <Text style={styles.secondarySignalHeadline} numberOfLines={1}>{secondarySignal.title}</Text>
              <Text style={styles.secondarySignalText} numberOfLines={3}>{secondarySignal.description}</Text>
            </>
          ) : (
            <Text style={styles.secondarySignalText}>
              No second major signal is standing out. Use cash pressure and the main brief to guide the day.
            </Text>
          )}
        </HighlightOnChangeView>
      </View>

      {bullets.length > 0 ? (
        <View style={styles.impactBox}>
          <Text style={styles.impactTitle}>Driving signals</Text>
          {bullets.map((bullet, index) => (
            <Text key={`impact_${index}`} style={styles.impactBullet} numberOfLines={2}>• {bullet}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#d6e1f2',
    borderRadius: theme.radius.xl,
    backgroundColor: '#fdfefe',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  heroBlock: {
    gap: theme.spacing.xs,
  },
  headerLabel: {
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#1d4ed8',
    fontWeight: '800',
  },
  headline: {
    ...theme.typography.headingLg,
    color: theme.color.textPrimary,
    fontWeight: '800',
  },
  summary: {
    color: theme.color.textSecondary,
    ...theme.typography.bodyMd,
    lineHeight: 20,
  },
  primarySignalBox: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  primarySignalRisk: {
    borderColor: '#fecaca',
    backgroundColor: '#fff6f5',
  },
  primarySignalOpportunity: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f3fff7',
  },
  primarySignalLabel: {
    ...theme.typography.caption,
    color: theme.color.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  primarySignalTitle: {
    color: theme.color.textPrimary,
    ...theme.typography.headingSm,
    fontWeight: '800',
  },
  primarySignalText: {
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
  },
  bottomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickActionBox: {
    flex: 1.2,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#dbe4ef',
    borderRadius: theme.radius.xl,
    backgroundColor: '#ffffff',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  quickActionTitle: {
    color: '#1d4ed8',
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  quickActionItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  quickActionIndex: {
    color: '#1d4ed8',
    ...theme.typography.label,
    fontWeight: '800',
    minWidth: 20,
  },
  quickActionCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  quickActionName: {
    color: theme.color.textPrimary,
    ...theme.typography.bodyMd,
    fontWeight: '700',
  },
  quickActionReason: {
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
  },
  neutralBody: {
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
  },
  secondarySignalBox: {
    flex: 0.9,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#dbe4ef',
    borderRadius: theme.radius.xl,
    backgroundColor: '#f8fafc',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  secondarySignalTitle: {
    color: theme.color.textSecondary,
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '800',
  },
  secondarySignalHeadline: {
    color: theme.color.textPrimary,
    ...theme.typography.bodyMd,
    fontWeight: '700',
  },
  secondarySignalText: {
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
  },
  impactBox: {
    gap: theme.spacing.xs,
  },
  impactTitle: {
    color: theme.color.textSecondary,
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '800',
  },
  impactBullet: {
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
  },
});
