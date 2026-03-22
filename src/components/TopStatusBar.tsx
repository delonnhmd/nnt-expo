import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/design/theme';
import { useDebt } from '@/hooks/useDebt';

// Gold Penny status bar — shows active debt warning when applicable.
// (NNT/GNNT balance, ad-credits, and NNT airdrop display removed in Step 43.5 cleanup.)
export default function TopStatusBar() {
  const { outstanding: debt } = useDebt();

  if (debt <= 0) return null;

  const formattedDebt = Number.isFinite(debt) ? debt.toLocaleString() : String(debt);

  return (
    <View style={styles.containerDebt}>
      <Text style={styles.debt} numberOfLines={2}>
        Debt lock active: {formattedDebt} outstanding. Posting and voting remain paused until repayment.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  containerDebt: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#3f0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#7f1d1d',
  },
  debt: {
    color: '#fecaca',
    textAlign: 'center',
    ...theme.typography.bodySm,
  },
});
