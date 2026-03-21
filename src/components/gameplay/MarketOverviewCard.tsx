import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { marketMoodColor, marketMoodLabel } from '@/lib/economyPresentationFormatters';
import { MarketOverviewResponse } from '@/types/economyPresentation';

export default function MarketOverviewCard({ overview }: { overview: MarketOverviewResponse }) {
  const moodColor = marketMoodColor(overview.current_market_mood);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Market Overview</Text>
      <View style={styles.moodRow}>
        <Text style={styles.moodLabel}>Current Mood</Text>
        <Text style={[styles.moodValue, { color: moodColor }]}>{marketMoodLabel(overview.current_market_mood)}</Text>
      </View>
      <Text style={styles.explainer}>{overview.short_explainer}</Text>

      <View style={styles.grid}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Headline Drivers</Text>
          {overview.headline_drivers.slice(0, 3).map((item, index) => (
            <Text key={`driver_${index}`} style={styles.itemText}>• {item}</Text>
          ))}
        </View>
        <View style={styles.column}>
          <Text style={[styles.columnTitle, { color: '#166534' }]}>Top Winners</Text>
          {overview.top_winners.slice(0, 3).map((item, index) => (
            <Text key={`winner_${index}`} style={styles.itemText}>• {item}</Text>
          ))}
        </View>
        <View style={styles.column}>
          <Text style={[styles.columnTitle, { color: '#b91c1c' }]}>Top Losers</Text>
          {overview.top_losers.slice(0, 3).map((item, index) => (
            <Text key={`loser_${index}`} style={styles.itemText}>• {item}</Text>
          ))}
        </View>
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
    gap: 8,
  },
  heading: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moodValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  explainer: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  grid: {
    gap: 8,
  },
  column: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    gap: 4,
  },
  columnTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  itemText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
});
