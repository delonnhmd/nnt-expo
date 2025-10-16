import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { useBackend } from '@/hooks/useBackend';

export default function LeaderboardPage() {
  const backend = useBackend();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [token, setToken] = useState<'gnnt'|'nnt'>('gnnt');
  const [venue, setVenue] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await backend.leaderboard(token, 100);
        // venue filter is stubbed; later can pass ?venue= to backend
        const list = (res?.entries ?? []).filter((e: any) => !venue || String(e.venue || '').toLowerCase().includes(venue.toLowerCase()));
        setEntries(list);
      } catch (e) {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, venue]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      <View style={styles.row}>
        <Text style={styles.link} onPress={() => setToken('gnnt')}>GNNT</Text>
        <Text style={styles.sep}>|</Text>
        <Text style={styles.link} onPress={() => setToken('nnt')}>NNT</Text>
      </View>
      <TextInput value={venue} onChangeText={setVenue} placeholder="Filter by venue (stub)" style={styles.input} />
      {loading ? <ActivityIndicator /> : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.address}
          renderItem={({ item, index }) => (
            <View style={styles.item}>
              <Text style={styles.rank}>{index+1}</Text>
              <Text style={styles.addr}>{item.address}</Text>
              <Text style={styles.score}>{token==='gnnt' ? item.gnntPoints : item.nntPoints}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  link: { color: '#2962ff', fontWeight: '600' },
  sep: { color: '#666' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, marginBottom: 8 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rank: { width: 28, textAlign: 'center', fontWeight: '600' },
  addr: { flex: 1 },
  score: { width: 80, textAlign: 'right', fontWeight: '700' },
});
