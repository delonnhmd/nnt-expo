import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApi } from '@/lib/api';
import { router } from 'expo-router';

type Tab = 'Posts' | 'Users';

export default function AdminDashboard() {
  const [tokenExists, setTokenExists] = useState(false);
  const [stats, setStats] = useState<{ users: number; today_rows: number; today_ad_nnt: string; today_votes: number } | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('Posts');
  const [users, setUsers] = useState<any[]>([]);
  const [uQuery, setUQuery] = useState('');

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('admin:token');
      setTokenExists(!!t);
      await reload();
    })();
  }, []);

  const reload = async () => {
    setLoading(true);
    try {
      const api = await getApi();
      const [m, f, u] = await Promise.allSettled([
        api.adminMetrics(),
        api.getFeed(),
        api.adminUsers(uQuery, 100),
      ]);
      if (m.status === 'fulfilled') setStats(m.value as any);
      if (f.status === 'fulfilled') setFeed(Array.isArray(f.value) ? f.value : []);
      if (u.status === 'fulfilled') setUsers(Array.isArray(u.value) ? u.value : []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const onHide = async (postId: string | number) => {
    try {
      const api = await getApi();
      await api.adminPostHide(postId);
      Alert.alert('Hidden', `Post ${postId} hidden.`);
      await reload();
    } catch (e:any) { Alert.alert('Error', e?.message||String(e)); }
  };
  const onUnhide = async (postId: string | number) => {
    try {
      const api = await getApi();
      await api.adminPostUnhide(postId);
      Alert.alert('Unhidden', `Post ${postId} visible.`);
      await reload();
    } catch (e:any) { Alert.alert('Error', e?.message||String(e)); }
  };

  const onLock = async (addr: string) => {
    try { const api = await getApi(); await api.adminUserLockAddress(addr); Alert.alert('Locked', short(addr)); await reload(); }
    catch (e:any) { Alert.alert('Error', e?.message||String(e)); }
  };
  const onUnlock = async (addr: string) => {
    try { const api = await getApi(); await api.adminUserUnlockAddress(addr); Alert.alert('Unlocked', short(addr)); await reload(); }
    catch (e:any) { Alert.alert('Error', e?.message||String(e)); }
  };
  const onResetCaps = async (addr: string) => {
    try { const api = await getApi(); await api.adminUserResetCaps(addr); Alert.alert('Caps reset', short(addr)); }
    catch (e:any) { Alert.alert('Error', e?.message||String(e)); }
  };

  const short = (a: string) => (a?.length > 12 ? `${a.slice(0,6)}…${a.slice(-4)}` : a);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text style={styles.title}>Admin Dashboard</Text>
        {!tokenExists && (
          <Text style={styles.warn}>No admin token set. Go to Settings to configure Admin Bearer Token and Address.</Text>
        )}
        <TouchableOpacity style={styles.smallLink} onPress={() => router.push('/settings')}>
          <Text style={styles.smallLinkText}>Open Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Platform Stats</Text>
        <Text style={styles.kv}>Users: {stats?.users ?? 0}</Text>
        <Text style={styles.kv}>Rows Today: {stats?.today_rows ?? 0}</Text>
        <Text style={styles.kv}>Votes Today: {stats?.today_votes ?? 0}</Text>
        <Text style={styles.kv}>Ad NNT Today: {stats?.today_ad_nnt ?? '0'}</Text>
        <TouchableOpacity style={styles.button} onPress={reload} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Refreshing…' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['Posts','Users'] as Tab[]).map(k => (
          <TouchableOpacity key={k} onPress={() => setTab(k)} style={[styles.pill, tab===k && { backgroundColor: '#111827' }]}>
            <Text style={[styles.pillText, tab===k && { color: '#fff' }]}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'Posts' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Posts</Text>
          {feed.map((p) => (
            <View key={String(p?.id ?? Math.random())} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{p?.title || String(p?.content || '').slice(0, 80)}</Text>
                <Text style={styles.rowSub}>{p?.id ? `#${p.id}` : ''} {p?.hidden ? '• hidden' : ''}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.pill, { backgroundColor: '#E5E7EB' }]} onPress={() => onHide(p?.id)}>
                  <Text style={styles.pillText}>Hide</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pill, { backgroundColor: '#D1FAE5' }]} onPress={() => onUnhide(p?.id)}>
                  <Text style={[styles.pillText, { color: '#065F46' }]}>Unhide</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {feed.length === 0 && <Text style={styles.rowSub}>No posts found.</Text>}
        </View>
      )}

      {tab === 'Users' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Users</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <TextInput value={uQuery} onChangeText={setUQuery} placeholder="Search address…" style={styles.input} autoCapitalize='none' />
            <TouchableOpacity style={styles.button} onPress={reload}><Text style={styles.buttonText}>Search</Text></TouchableOpacity>
          </View>
          {users.map((u) => (
            <View key={String(u.address)} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{short(String(u.address))} {u.locked ? '• locked' : ''} {u.isAdmin ? '• admin' : ''}</Text>
                <Text style={styles.rowSub}>Posts {u.postsCount} • Votes {u.votesCount} • NNT {u.nnt} • GNNT {u.gnnt}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <TouchableOpacity style={styles.pill} onPress={() => onLock(String(u.address))}><Text style={styles.pillText}>Lock</Text></TouchableOpacity>
                <TouchableOpacity style={styles.pill} onPress={() => onUnlock(String(u.address))}><Text style={styles.pillText}>Unlock</Text></TouchableOpacity>
                <TouchableOpacity style={styles.pill} onPress={() => onResetCaps(String(u.address))}><Text style={styles.pillText}>Reset Caps</Text></TouchableOpacity>
              </View>
            </View>
          ))}
          {users.length === 0 && <Text style={styles.rowSub}>No users found.</Text>}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>User Actions</Text>
        <Text style={styles.rowSub}>Open a user and use Lock/Unlock/Reset Caps controls.</Text>
        <TouchableOpacity style={styles.pill} onPress={() => router.push('/authors')}>
          <Text style={styles.pillText}>Browse Authors</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  warn: { color: '#B45309' },
  smallLink: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#F3F4F6', borderRadius: 8 },
  smallLinkText: { color: '#111827', fontWeight: '600' },
  card: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  kv: { color: '#374151' },
  button: { backgroundColor: '#111827', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  rowTitle: { fontSize: 14, color: '#111827', fontWeight: '600' },
  rowSub: { fontSize: 12, color: '#6B7280' },
  pill: { paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#E5E7EB', borderRadius: 9999 },
  pillText: { fontWeight: '600', color: '#111827' },
  input: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, color: '#111827' },
});
