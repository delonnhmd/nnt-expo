import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { severityColor } from '@/lib/gameplayFormatters';
import { PlayerDashboardResponse } from '@/types/gameplay';

function SignalColumn({
  title,
  tone,
  items,
}: {
  title: string;
  tone: string;
  items: { title: string; description: string; severity?: string }[];
}) {
  return (
    <View style={styles.column}>
      <Text style={[styles.columnTitle, { color: tone }]}>{title}</Text>
      {items.length > 0 ? (
        items.slice(0, 4).map((item, index) => (
          <View key={`${title}_${index}`} style={styles.itemRow}>
            <Text style={[styles.dot, { color: severityColor(item.severity as any) }]}>●</Text>
            <View style={styles.itemCopy}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemText}>{item.description}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No strong signals right now.</Text>
      )}
    </View>
  );
}

export default function RiskOpportunityPanel({ dashboard }: { dashboard: PlayerDashboardResponse }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Risk and Opportunity</Text>
      <View style={styles.grid}>
        <SignalColumn
          title="Opportunities"
          tone="#166534"
          items={dashboard.top_opportunities.map((item) => ({
            title: item.title,
            description: item.description,
            severity: item.severity,
          }))}
        />
        <SignalColumn
          title="Risks"
          tone="#b91c1c"
          items={dashboard.top_risks.map((item) => ({
            title: item.title,
            description: item.description,
            severity: item.severity,
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
  heading: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  column: {
    flex: 1,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    gap: 8,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    marginTop: 2,
    fontSize: 12,
  },
  itemCopy: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  itemText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
  },
});
