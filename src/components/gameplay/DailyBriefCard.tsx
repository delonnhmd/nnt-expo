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

  return (
    <View style={styles.card}>
      <Text style={styles.headerLabel}>Daily Brief</Text>
      <Text style={styles.headline}>{dashboard.headline || 'Today at Gold Penny'}</Text>
      <Text style={styles.summary}>{dashboard.daily_brief || 'No summary available.'}</Text>
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
});
