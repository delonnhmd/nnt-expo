import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getApi } from '@/lib/api';

export default function RewardsScreen() {
  const [me, setMe] = React.useState<{ nnt: number; gnnt: number; ads: { used: number; cap: number } } | null>(null);
  const [rc, setRc] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const api = await getApi();
      try { await api.register(); } catch {}
      try { const m = await api.meBalance(); setMe(m); } catch {}
      try { const r = await api.rewardsCurrent(); setRc(r); } catch {}
    } catch (e: any) {
      Alert.alert('Error', e?.message || String(e));
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  const adsLeft = (me?.ads?.cap ?? 0) - (me?.ads?.used ?? 0);
  const viewReward = rc?.ad?.viewRewardGNNT ?? rc?.ad?.viewReward ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Rewards</Text>
      <View style={styles.card}>
        <Text style={styles.row}>NNT: {me?.nnt ?? 0}</Text>
        <Text style={styles.row}>GNNT: {me?.gnnt ?? 0}</Text>
        <Text style={styles.row}>Ads Left Today: {adsLeft}</Text>
        <Text style={styles.row}>Per Ad Reward (GNNT): {viewReward}</Text>
        <TouchableOpacity style={styles.button} onPress={refresh} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Refreshing…' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Airdrop / Pool</Text>
        <Text style={styles.row}>Treasury: {rc?.legacyAdPool?.treasury ?? '—'}</Text>
        <Text style={styles.row}>Pool Cut (bps): {rc?.ad?.poolCutBps ?? rc?.poolCutBps ?? '—'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: 'white', gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, gap: 8 },
  row: { fontSize: 14 },
  subtitle: { fontSize: 16, fontWeight: '700' },
  button: { backgroundColor: '#111827', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  buttonText: { color: 'white', fontWeight: '700' },
});
