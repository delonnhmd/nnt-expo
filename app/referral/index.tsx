import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useWallet } from '@/hooks/useWallet';

function makeCode(addr?: string) {
  if (!addr) return '-----';
  return `NNT-${addr.slice(2, 8).toUpperCase()}`;
}

export default function ReferralPage() {
  const { address } = useWallet();
  const code = useMemo(() => makeCode(address), [address]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Referral</Text>
      <Text style={styles.code}>{code}</Text>
      <View style={{ height: 12 }} />
      <Button title="Share QR (coming soon)" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  code: { fontSize: 20, fontWeight: '700', letterSpacing: 1, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 },
});
