import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { trendLabelText, trendTone, volatilityTone } from '@/lib/economyPresentationFormatters';
import { PriceTrendsResponse } from '@/types/economyPresentation';

function basketTitle(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (v) => v.toUpperCase());
}

export default function PriceTrendsCard({ trends }: { trends: PriceTrendsResponse }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Price Trends</Text>
      <View style={styles.list}>
        {trends.items.map((item) => (
          <View key={item.basket_key} style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{basketTitle(item.basket_key)}</Text>
              <View style={styles.badges}>
                <Text style={[styles.badge, { color: trendTone(item.short_term_trend) }]}>
                  {trendLabelText(item.short_term_trend)}
                </Text>
                <Text style={[styles.badge, { color: volatilityTone(item.volatility_label) }]}>
                  {String(item.volatility_label).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>Level {item.current_level.toFixed(2)} • Driver: {item.primary_driver}</Text>
            <Text style={styles.summary}>{item.player_impact_summary}</Text>
          </View>
        ))}
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
    fontSize: 17,
    fontWeight: '800',
  },
  list: {
    gap: 8,
  },
  item: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
  },
  meta: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  summary: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
});
