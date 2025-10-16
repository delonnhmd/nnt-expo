import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useBackend } from '@/hooks/useBackend';
import { useWallet } from '@/hooks/useWallet';

export default function ClaimPage() {
  const backend = useBackend();
  const { address } = useWallet();
  const [points, setPoints] = useState<{ nntPoints: number; gnntPoints: number } | null>(null);

  useEffect(() => {
    (async () => {
      if (!address) return;
      try {
        const p = await backend.getPoints(address);
        setPoints({ nntPoints: p?.nntPoints ?? 0, gnntPoints: p?.gnntPoints ?? 0 });
      } catch {}
    })();
  }, [address]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Claim</Text>
      <Text style={styles.points}>NNT Points: {points?.nntPoints ?? 0}</Text>
      <Text style={styles.points}>GNNT Points: {points?.gnntPoints ?? 0}</Text>
      <View style={{ height: 12 }} />
      <Button title="Claim on-chain (coming soon)" onPress={() => {}} disabled />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  points: { fontSize: 16, marginTop: 6 },
});
