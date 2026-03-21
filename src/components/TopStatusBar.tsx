import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDebt } from '@/hooks/useDebt';

// Gold Penny status bar — shows active debt warning when applicable.
// (NNT/GNNT balance, ad-credits, and NNT airdrop display removed in Step 43.5 cleanup.)
export default function TopStatusBar({ refreshKey = 0 }: { refreshKey?: number }) {
  const { outstanding: debt } = useDebt();

  if (debt <= 0) return null;

  return (
    <View style={styles.containerDebt}>
      <Text style={styles.debt}>
        🔒 Debt: {debt} — posting &amp; voting locked until repaid
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  containerDebt: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#3b0000',
  },
  debt: {
    color: '#ff9e9e',
    textAlign: 'center',
    fontWeight: '600',
  },
});
