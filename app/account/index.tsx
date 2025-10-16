import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from '@/hooks/useWallet';
import { useBackend } from '@/hooks/useBackend';
import { BACKEND } from '@/constants';

export default function AccountPage() {
  const { address } = useWallet();
  const { getPoints } = useBackend();
  const [streak, setStreak] = useState<number>(0);
  const [adsLeft, setAdsLeft] = useState<number>(0);
  const [nnt, setNnt] = useState<number>(0);
  const [gnnt, setGnnt] = useState<number>(0);

  useEffect(() => {
    (async () => {
      // Streak stub (persist/local-only for now)
      const key = `streak:${address ?? 'anon'}`;
      const raw = await AsyncStorage.getItem(key);
      let s = raw ? parseInt(raw, 10) : 1;
      if (!raw) await AsyncStorage.setItem(key, String(s));
      setStreak(s);
    })();
  }, [address]);

  useEffect(() => {
    (async () => {
      try {
        const p = await getPoints(address ?? '0x0');
        setNnt(p.nnt || 0);
        setGnnt(p.gnnt || 0);
      } catch {}
    })();
  }, [address]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`${BACKEND}/ad/credits`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ address, shape: 'min' })
        });
        const data = await resp.json();
        setAdsLeft(data.remaining ?? 0);
      } catch {}
    })();
  }, [address]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <View style={styles.row}><Text style={styles.label}>Address:</Text><Text style={styles.value}>{address ?? 'Not connected'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Streak:</Text><Text style={styles.value}>{streak} days</Text></View>
      <View style={styles.row}><Text style={styles.label}>Ads left today:</Text><Text style={styles.value}>{adsLeft}</Text></View>
      <View style={{ height: 16 }} />
      <Text style={styles.subtitle}>Points</Text>
      <View style={styles.row}><Text style={styles.label}>NNT:</Text><Text style={styles.value}>{nnt}</Text></View>
      <View style={styles.row}><Text style={styles.label}>GNNT:</Text><Text style={styles.value}>{gnnt}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 16, color: '#555' },
  value: { fontSize: 16, fontWeight: '600' },
});
