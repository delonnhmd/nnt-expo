import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import TopStatusBar from '@/components/TopStatusBar';
import { useUsers } from '@/hooks/useUsers';
import { usePosts } from '@/hooks/usePosts';
import { getApi } from '@/lib/api';
import { shortAddr } from '@/utils/format';

export default function AccountPage() {
  const { address } = useLocalSearchParams<{ address: string }>();
  const [refreshKey, setRefreshKey] = useState(0);
  const { loadUser } = useUsers();
  const postsApi = usePosts();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'Posts' | 'Comments' | 'Activity'>('Posts');
  const [filter, setFilter] = useState<'all' | 'saved' | 'popular' | 'recent'>('all');
  const [query, setQuery] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (!address) return;
      try {
        const u = await loadUser(address);
        setUser(u);
      } catch {}
      try {
        await postsApi.loadMine(address);
      } catch {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const mine = useMemo(() => postsApi.mine || [], [postsApi.mine]);
  const filtered = useMemo(() => {
    let list = [...mine];
    if (filter === 'popular') {
      list.sort((a: any, b: any) => {
        const aScore = Number(a?.trueCount ?? a?.true ?? 0) - Number(a?.fakeCount ?? a?.fake ?? 0);
        const bScore = Number(b?.trueCount ?? b?.true ?? 0) - Number(b?.fakeCount ?? b?.fake ?? 0);
        return bScore - aScore;
      });
    } else if (filter === 'recent') {
      list.sort((a: any, b: any) => Number(b?.createdAt ?? 0) - Number(a?.createdAt ?? 0));
    }
    return list;
  }, [mine, filter]);

  const [serverResults, setServerResults] = useState<any[] | null>(null);
  useEffect(() => {
    (async () => {
      if (!address) return;
      const q = query.trim();
      if (!q) { setServerResults(null); return; }
      try {
        const api = await getApi();
        const list = await api.searchUserPosts(String(address), q);
        setServerResults(Array.isArray(list) ? list : []);
      } catch {
        setServerResults([]);
      }
    })();
  }, [address, query]);

  const displayed = useMemo(() => {
    if (serverResults && query.trim()) return serverResults;
    return filtered;
  }, [serverResults, filtered, query]);

  if (!address) return null;

  const display = user?.displayName || shortAddr(address);
  const avatar = user?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
  const postsCount = user?.postsCount ?? mine.length;
  const upvotes = user?.upvotesCount ?? 0;
  const memberSince = user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : '—';
  // detect admin by presence of token
  useEffect(() => {
    (async () => {
      try {
        const storage = (await import('@react-native-async-storage/async-storage')).default;
        const t = await storage.getItem('admin:token');
        setIsAdmin(!!t);
      } catch {}
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <TopStatusBar refreshKey={refreshKey} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top search bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder="Search this user's posts..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <View style={styles.sectionRow}>
          {/* Left: Profile card + categories */}
          <View style={styles.leftCol}>
            <View style={styles.card}>
              <View style={{ gap: 12, width: '100%' }}>
                <Image source={{ uri: avatar }} style={styles.avatarXL} />
                <View>
                  <Text style={styles.heading2}>{display}</Text>
                  {user?.isVerified && <Badge label="Verified Writer" variant="success" />}
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <Text style={styles.subtext}>Total Posts: {postsCount}</Text>
                <Text style={styles.subtext}>Total Upvotes: {upvotes}</Text>
                <Text style={styles.subtext}>Member since {memberSince}</Text>
                {isAdmin && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <AdminButton label="Lock" onPress={async () => {
                      try { const api = await getApi(); await api.adminUserLockAddress(String(address)); Alert.alert('Locked', 'User locked.'); }
                      catch (e:any) { Alert.alert('Error', e?.message||String(e)); }
                    }} />
                    <AdminButton label="Unlock" onPress={async () => {
                      try { const api = await getApi(); await api.adminUserUnlockAddress(String(address)); Alert.alert('Unlocked', 'User unlocked.'); }
                      catch (e:any) { Alert.alert('Error', e?.message||String(e)); }
                    }} />
                    <AdminButton label="Reset Caps" onPress={async () => {
                      try { const api = await getApi(); await api.adminUserResetCaps(String(address)); Alert.alert('Reset', 'Daily caps reset.'); setRefreshKey(k=>k+1); }
                      catch (e:any) { Alert.alert('Error', e?.message||String(e)); }
                    }} />
                  </View>
                )}
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={styles.title}>Categories</Text>
              <View style={{ gap: 6 }}>
                <NavButton label="All Posts" icon="home" active={filter==='all'} onPress={() => setFilter('all')} />
                <NavButton label="Saved" icon="bookmark" active={filter==='saved'} onPress={() => { setFilter('saved'); Alert.alert('Saved', 'Showing saved posts (demo)'); }} />
                <NavButton label="Popular" icon="trending-up" active={filter==='popular'} onPress={() => setFilter('popular')} />
                <NavButton label="Recent" icon="clock" active={filter==='recent'} onPress={() => setFilter('recent')} />
              </View>
            </View>
          </View>

          {/* Middle: Tabs + post list */}
          <View style={styles.midCol}>
            <Tabs
              tabs={[{key:'Posts',label:'Posts'},{key:'Comments',label:'Comments'},{key:'Activity',label:'Activity'}]}
              activeKey={activeTab}
              onChange={(k) => setActiveTab(k as any)}
            />

            <View style={styles.badgeRow}>
              <Badge label="Technology" />
              <Badge label="Health" variant="neutral" />
              <Badge label="Finance" variant="neutral" />
              <Badge label="Sports" variant="neutral" />
              <Badge label="Entertainment" />
            </View>

            {activeTab === 'Posts' && (
              <View style={{ gap: 12 }}>
                {displayed.map((p: any) => (
                  <PostCard
                    key={String(p?.id ?? Math.random())}
                    postId={p?.id ?? '0'}
                    title={p?.title || (p?.content ? String(p.content).slice(0, 80) : 'Untitled')}
                    time={p?.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
                    trueCount={Number(p?.trueCount ?? p?.true ?? 0)}
                    fakeCount={Number(p?.fakeCount ?? p?.fake ?? 0)}
                    onAfterVote={() => setRefreshKey((k) => k + 1)}
                  />
                ))}

                {displayed.length === 0 && (
                  <View style={styles.card}><Text style={styles.subtext}>No posts yet.</Text></View>
                )}
              </View>
            )}

            {activeTab === 'Comments' && (
              <View style={styles.card}><Text style={styles.subtext}>Comments feature coming soon.</Text></View>
            )}
            {activeTab === 'Activity' && (
              <View style={styles.card}><Text style={styles.subtext}>Recent activity coming soon.</Text></View>
            )}
          </View>

          {/* Right: About + top categories */}
          <View style={styles.rightCol}>
            <View style={{ gap: 10 }}>
              <Text style={styles.title}>About</Text>
              <View style={styles.card}>
                <Text style={styles.bodyText}>
                  {user?.bio || 'Tech enthusiast and healthcare professional sharing insights on the intersection of technology and medicine.'}
                </Text>
              </View>
            </View>
            <View style={{ gap: 10 }}>
              <Text style={styles.title}>Top Categories</Text>
              <View style={styles.card}>
                <CategoryStats posts={mine} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---- Small UI helpers ---- */

function Badge({ label, variant = 'solid' }: { label: string; variant?: 'solid' | 'neutral' | 'success' }) {
  const stylesMap: any = {
    solid: { bg: '#111827', color: '#fff' },
    neutral: { bg: '#F3F4F6', color: '#111827' },
    success: { bg: '#DCFCE7', color: '#166534' },
  };
  const s = stylesMap[variant] || stylesMap.solid;
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 9999, paddingVertical: 6, paddingHorizontal: 10 }}>
      <Text style={{ color: s.color, fontWeight: '600', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function NavButton({ label, icon, active, onPress }: { label: string; icon: React.ComponentProps<typeof Feather>['name']; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.navBtn, active && { backgroundColor: '#E5E7EB' }] }>
      <Feather name={icon} size={16} color="#111827" />
      <Text style={styles.navBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Tabs({ tabs, activeKey, onChange }: { tabs: { key: string; label: string }[]; activeKey: string; onChange: (k: string) => void }) {
  return (
    <View style={styles.tabs}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <TouchableOpacity key={t.key} onPress={() => onChange(t.key)} style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PostCard({ postId, title, time, trueCount, fakeCount, onAfterVote }: { postId: number | string; title: string; time?: string; trueCount: number; fakeCount: number; onAfterVote?: () => void; }) {
  const [tCount, setTCount] = useState<number>(trueCount);
  const [fCount, setFCount] = useState<number>(fakeCount);
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storage = (await import('@react-native-async-storage/async-storage')).default;
        const t = await storage.getItem('admin:token');
        setIsAdmin(!!t);
      } catch {}
    })();
  }, []);

  const vote = async (sideTrue: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const api = await getApi();
      await api.vote(postId, sideTrue);
      if (sideTrue) setTCount((x) => x + 1); else setFCount((x) => x + 1);
      onAfterVote?.();
    } catch (e: any) {
      Alert.alert('Vote failed', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ gap: 6 }}>
          <Badge label="TRENDING" />
          <Text style={styles.heading3}>{title}</Text>
          {!!time && <Text style={styles.subtext}>Posted {time}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={[styles.count, { color: '#16A34A' }]}>{tCount}</Text>
          <Text style={[styles.count, { color: '#DC2626' }]}>{fCount}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <PrimaryButton label="True" icon="thumbs-up" onPress={() => vote(true)} disabled={busy} />
        <SecondaryButton label="Fake" icon="thumbs-down" onPress={() => vote(false)} disabled={busy} />
        <RoundIcon name="share-2" onPress={() => Alert.alert('Share', 'Share link copied (demo).')} />
        <RoundIcon name="bookmark" onPress={() => Alert.alert('Saved', 'Saved to bookmarks (demo).')} />
        {isAdmin && (
          <>
            <RoundIcon name="eye-off" onPress={async () => {
              try { const api = await getApi(); await api.adminPostHide(postId); Alert.alert('Hidden', 'Post hidden.'); onAfterVote?.(); }
              catch (e:any) { Alert.alert('Error', e?.message||String(e)); }
            }} />
            <RoundIcon name="eye" onPress={async () => {
              try { const api = await getApi(); await api.adminPostUnhide(postId); Alert.alert('Unhidden', 'Post visible.'); onAfterVote?.(); }
              catch (e:any) { Alert.alert('Error', e?.message||String(e)); }
            }} />
          </>
        )}
      </View>
    </View>
  );
}

function CategoryStats({ posts }: { posts: any[] }) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) => {
      const c = String(p?.category || 'General');
      map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [posts]);
  return (
    <View style={{ gap: 8 }}>
      {counts.map(([name, cnt]) => (
        <View key={name} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.bodyText}>{name}</Text>
          <Badge label={`${cnt} posts`} />
        </View>
      ))}
      {counts.length === 0 && <Text style={styles.subtext}>No categories yet.</Text>}
    </View>
  );
}

function PrimaryButton({ label, icon, onPress, disabled }: { label: string; icon: React.ComponentProps<typeof Feather>['name']; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.btn, disabled && { opacity: 0.6 }]}>
      <Feather name={icon} size={16} color="#FFFFFF" />
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({ label, icon, onPress, disabled }: { label: string; icon: React.ComponentProps<typeof Feather>['name']; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.btnSecondary, disabled && { opacity: 0.6 }]}>
      <Feather name={icon} size={16} color="#111827" />
      <Text style={styles.btnSecondaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

function RoundIcon({ name, onPress }: { name: React.ComponentProps<typeof Feather>['name']; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.roundIcon}>
      <Feather name={name} size={18} color="#111827" />
    </TouchableOpacity>
  );
}

/* ---- Styles ---- */

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  sectionRow: { flexDirection: 'column', gap: 16 },
  leftCol: { gap: 16 },
  midCol: { gap: 12 },
  rightCol: { gap: 16 },

  card: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, gap: 12 },

  avatarXL: { width: 96, height: 96, borderRadius: 48 },
  heading2: { fontSize: 22, fontWeight: '700', color: '#111827' },
  heading3: { fontSize: 18, fontWeight: '700', color: '#111827' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  bodyText: { fontSize: 14, color: '#111827' },
  subtext: { fontSize: 12, color: '#6B7280' },
  count: { fontSize: 16, fontWeight: '700' },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabs: { flexDirection: 'row', gap: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9999 },
  tabActive: { backgroundColor: '#111827' },
  tabText: { fontSize: 14, color: '#111827' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  input: { flex: 1, fontSize: 14, color: '#111827' },

  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  navBtnText: { color: '#111827', fontWeight: '600' },

  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnText: { color: '#FFFFFF', fontWeight: '600' },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E5E7EB', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnSecondaryText: { color: '#111827', fontWeight: '600' },
  roundIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
});

function AdminButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 }}>
      <Text style={{ color: '#fff', fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}
