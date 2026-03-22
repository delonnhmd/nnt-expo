import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PlayerDashboardResponse } from '@/types/gameplay';

function SignalList({
  title,
  items,
  tone,
}: {
  title: string;
  items: { title: string; description: string }[];
  tone: string;
}) {
  return (
    <View style={styles.signalSection}>
      <Text style={[styles.signalTitle, { color: tone }]}>{title}</Text>
      {items.length > 0 ? (
        items.slice(0, 3).map((item, index) => (
          <View key={`${title}_${index}`} style={styles.signalItem}>
            <Text style={styles.signalItemTitle}>{item.title}</Text>
            <Text style={styles.signalItemText}>{item.description}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No major signals yet.</Text>
      )}
    </View>
  );
}

export default function DailyBriefCard({
  dashboard,
  impactBullets,
}: {
  dashboard: PlayerDashboardResponse;
  impactBullets?: string[];
}) {
  const bullets = (impactBullets || []).filter(Boolean).slice(0, 3);
  const recommendedActions = (dashboard.recommended_actions || []).filter(Boolean).slice(0, 3);
  const hasSignals = dashboard.top_opportunities.length > 0 || dashboard.top_risks.length > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.headerLabel}>Daily Brief</Text>
      <Text style={styles.headline}>{dashboard.headline || 'Today at Gold Penny'}</Text>
      <Text style={styles.summary}>{dashboard.daily_brief || 'No summary available.'}</Text>
      {recommendedActions.length > 0 ? (
        <View style={styles.recommendationBox}>
          <Text style={styles.recommendationTitle}>Best Next Moves</Text>
          {recommendedActions.map((action, index) => (
            <View key={`${action.action_key}_${index}`} style={styles.recommendationItem}>
              <Text style={styles.recommendationAction}>{action.title}</Text>
              <Text style={styles.recommendationReason}>{action.reason}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.neutralBox}>
          <Text style={styles.neutralTitle}>Best Next Move</Text>
          <Text style={styles.neutralBody}>No direct move is flagged right now. Protect cash first, then take the lowest-risk action that improves tomorrow&apos;s position.</Text>
        </View>
      )}
      {bullets.length > 0 ? (
        <View style={styles.impactBox}>
          <Text style={styles.impactTitle}>Driving Signals</Text>
          {bullets.map((bullet, index) => (
            <Text key={`impact_${index}`} style={styles.impactBullet}>• {bullet}</Text>
          ))}
        </View>
      ) : null}
      <View style={styles.signalGrid}>
        <SignalList
          title="Top Opportunities"
          tone="#166534"
          items={dashboard.top_opportunities.map((entry) => ({
            title: entry.title,
            description: entry.description,
          }))}
        />
        <SignalList
          title="Top Risks"
          tone="#b91c1c"
          items={dashboard.top_risks.map((entry) => ({
            title: entry.title,
            description: entry.description,
          }))}
        />
      </View>
      {!hasSignals ? <Text style={styles.footerHint}>The economy snapshot is still partial. Use the Daily Brief headline and your cash pressure as the main guide.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 10,
  },
  headerLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#475569',
    fontWeight: '700',
  },
  headline: {
    fontSize: 20,
    lineHeight: 26,
    color: '#0f172a',
    fontWeight: '800',
  },
  summary: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  signalSection: {
    flex: 1,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    gap: 8,
  },
  signalTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  signalItem: {
    gap: 2,
  },
  signalItemTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  signalItemText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
  },
  impactBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    gap: 4,
  },
  recommendationBox: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    padding: 10,
    gap: 8,
  },
  neutralBox: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 10,
    backgroundColor: '#f8fbff',
    padding: 10,
    gap: 4,
  },
  neutralTitle: {
    color: '#1e40af',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  neutralBody: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 17,
  },
  recommendationTitle: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationItem: {
    gap: 2,
  },
  recommendationAction: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  recommendationReason: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 17,
  },
  impactTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  impactBullet: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
  },
  footerHint: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
  },
});
