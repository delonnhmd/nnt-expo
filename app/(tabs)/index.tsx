import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, Alert, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getApi } from '@/lib/api';
import TopStatusBar from '@/components/TopStatusBar';
import { useWallet } from '@/hooks';
import { router } from 'expo-router';

export default function MainPage() {
  const { address } = useWallet();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'Top' | 'Viewed' | 'Latest'>('Top');
  const [watchingAd, setWatchingAd] = useState(false);
  const [feed, setFeed] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [metrics, setMetrics] = useState<{ users: number; today_rows: number; today_ad_nnt: string; today_votes: number } | null>(null);

  const onCreatePost = async () => {
    // Allow creating posts without wallet gating (admin or guest can proceed)
    try { router.push('/compose'); } catch { router.push('/modal'); }
  };

  const onWatchAd = async () => {
    if (watchingAd) return;
    setWatchingAd(true);
    try {
      const api = await getApi();
      // ensure registration so UID/FP exist server-side
      try { await api.register(); } catch {}
      await api.adComplete();
  Alert.alert('Thanks!', 'Ad completed. Points awarded if available.');
  setRefreshKey((k) => k + 1);
    } catch (e: any) {
      Alert.alert('Ad failed', e?.message || String(e));
    } finally {
      setWatchingAd(false);
    }
  };

  const onUpload = async () => {
    try {
      let picker: any;
      try {
        // Lazy-load the image picker so the app doesn't crash if the native module isn't in the installed build
        picker = await import('expo-image-picker');
      } catch (e: any) {
        Alert.alert(
          'Feature unavailable',
          'This app build does not include the Image Picker. Please install the latest build or use a version with media upload enabled.'
        );
        return;
      }

      const perm = await picker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert('Permission required', 'Media library permission is needed.'); return; }
      const res = await picker.launchImageLibraryAsync({ mediaTypes: picker.MediaTypeOptions.All, allowsEditing: false, quality: 0.8 });
      if (res.canceled || !res.assets || !res.assets[0]) return;
      const asset = res.assets[0];
      const uri = asset.uri;
      if (!uri) return;
      setUploading(true);
      // Build multipart form-data
      const form = new FormData();
      const nameGuess = uri.split('/').pop() || 'upload.bin';
      // best-effort content type
      const ct = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
      // React Native FormData accepts file objects with a "uri" field, which isn't in DOM typings
      form.append('file', ({ uri, name: nameGuess, type: ct } as unknown) as any);
      const apiBase = process.env.EXPO_PUBLIC_BACKEND || '';
      const r = await fetch(`${apiBase}/upload`, { method: 'POST', body: form, headers: { /* identity headers automatically added by our json helper; here we upload raw */ } as any });
      const txt = await r.text();
      const j = txt ? JSON.parse(txt) : null;
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      Alert.alert('Uploaded', `URL: ${j.url}`);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoadingFeed(true);
      try {
        const api = await getApi();
        // auto-register silently (simulated account)
        try { await api.register(); } catch {}
        // refresh stats
        try { const m = await api.adminMetrics(); setMetrics(m); } catch {}
        if (search.trim().length > 0) {
          const list = await api.searchSite(search.trim());
          setFeed(Array.isArray(list) ? list : []);
        } else {
          const list = await api.getFeed();
          setFeed(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        // ignore; stay with sample
      } finally {
        setLoadingFeed(false);
      }
    })();
  }, [search]);

  const filtered = useMemo(() => {
    // Server delivers already-filtered results when search is non-empty
    return feed && feed.length ? feed : [];
  }, [feed]);

  return (
    <View style={styles.container}>
      <TopStatusBar refreshKey={refreshKey} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Feather name="book-open" size={20} color="#111827" />
          </View>
          <Text style={styles.title}>NNT News</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.searchBox}>
            <Feather name="search" size={18} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="Search news..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label={address ? 'Connected' : 'Connect Wallet'} onPress={async () => {
              try {
                const api = await getApi();
                try { await api.register(); } catch {}
                // attempt to connect WalletConnect and ensure correct chain
                const w = require('@/hooks').useWallet; // dynamic to avoid circular at import time
                // Can't call hook here; instead, route user to account page where wallet UI exists
                router.push('/user/0xme');
              } catch (e: any) {
                Alert.alert('Wallet', e?.message || String(e));
              }
            }} />
            <Button label="Register" onPress={async () => {
              try { const api = await getApi(); const r = await api.register(); Alert.alert('Registered', 'Account initialized.'); setRefreshKey((k)=>k+1); }
              catch(e:any){ Alert.alert('Register failed', e?.message||String(e)); }
            }} />
          </View>
          <Button label="Create Post" onPress={onCreatePost} />
          {/* Watch Ad on the right side */}
          <Button label={watchingAd ? 'Watching…' : 'Watch Ad'} onPress={onWatchAd} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statRow}>
            <Text style={styles.subtext}>Total Users: {metrics?.users ?? 0}</Text>
            <Text style={styles.subtext}>Today Ad NNT: {metrics?.today_ad_nnt ?? '0'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.subtext}>Today Rows: {metrics?.today_rows ?? 0}</Text>
            <Text style={styles.subtext}>Today Votes: {metrics?.today_votes ?? 0}</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoryRow}>
            <IconButton label="Home" icon="home" onPress={() => router.push('/')} />
            <IconButton label="Authors" icon="users" onPress={() => router.push('/authors')} />
            <IconButton label="My Wallet" icon="credit-card" onPress={() => router.push('/(tabs)/rewards')} />
            <IconButton label="Submit" icon="plus" onPress={onCreatePost} />
            <IconButton label="Settings" icon="settings" onPress={() => router.push('/settings')} />
            <IconButton label="Admin" icon="shield" onPress={() => router.push('/admin')} />
          </View>
        </View>

        {/* Tabs */}
        <Tabs
          tabs={[
            { key: 'Top', label: 'Top Voted' },
            { key: 'Viewed', label: 'Most Viewed' },
            { key: 'Latest', label: 'Latest' },
          ]}
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
        />

        {/* Badges */}
        <View style={styles.badgeRow}>
          {["Technology", "Health", "Finance", "Sports", "Entertainment", "Life Style", "Politic"].map(
            (t, i) => (
              <Badge key={i} label={t} variant={i === 0 ? 'solid' : 'neutral'} />
            )
          )}
        </View>

        {/* Sample posts */}
        {loadingFeed && (
          <View style={styles.card}><Text style={styles.subtext}>Loading…</Text></View>
        )}
        {!loadingFeed && filtered.length === 0 && (
          <>
            <PostCard
              postId={101}
              trending
              title="Video platform to cease operations next month"
              author="Jane Doe"
              time="2 hours ago"
              trueCount={6}
              fakeCount={2}
              footer="Requires 10 votes to finalize • Accruing • 48h left"
            />
            <PostCard
              postId={102}
              title="Study shows surprising benefit of eating chocolate"
              author="John Smith"
              avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              time="5 hours ago"
              trueCount={5}
              fakeCount={0}
            />
          </>
        )}
        {filtered.map((p: any) => (
          <PostCard
            key={String(p?.id ?? Math.random())}
            postId={p?.id ?? '0'}
            title={p?.title || (p?.content ? String(p.content).slice(0, 80) : 'Untitled')}
            author={p?.author || 'Unknown'}
            time={p?.createdAt ? String(p.createdAt) : ''}
            trueCount={Number(p?.trueCount ?? p?.true ?? 0)}
            fakeCount={Number(p?.fakeCount ?? p?.fake ?? 0)}
          />
        ))}

        {/* Right-hand stacked sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Categories</Text>
          <View style={styles.followGrid}>
            {["Finance", "Health", "Sport", "Entertainment", "Life Style", "Politic", "Technology"].map(
              (c) => (
                <FollowRow key={c} label={c} />
              )
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Authors</Text>
          <View style={{ gap: 10 }}>
            <AuthorRow
              name="Jane Doe"
              avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            />
            <AuthorRow
              name="Michael Wright"
              avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Small reusable UI bits ---------- */

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function IconButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.iconBtn} onPress={onPress}>
      <Feather name={icon} size={16} color="#111827" />
      <Text style={styles.iconBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Badge({
  label,
  variant = 'neutral',
}: {
  label: string;
  variant?: 'solid' | 'neutral';
}) {
  const solid = variant === 'solid';
  return (
    <View style={[styles.badge, solid ? styles.badgeSolid : styles.badgeNeutral]}>
      <Text style={[styles.badgeText, solid ? styles.badgeTextSolid : styles.badgeTextNeutral]}>
        {label}
      </Text>
    </View>
  );
}

function Tabs({
  tabs,
  activeKey,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  activeKey: string;
  onChange: (k: string) => void;
}) {
  return (
    <View style={styles.tabs}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(t.key)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PostCard({
  postId,
  trending,
  title,
  author,
  time,
  avatar,
  trueCount,
  fakeCount,
  footer,
}: {
  postId: number | string;
  trending?: boolean;
  title: string;
  author: string;
  time: string;
  avatar?: string;
  trueCount: number;
  fakeCount: number;
  footer?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [voted, setVoted] = useState<null | boolean>(null);
  const [tCount, setTCount] = useState(trueCount);
  const [fCount, setFCount] = useState(fakeCount);

  const onVote = async (sideTrue: boolean) => {
    if (busy || voted !== null) return;
    setBusy(true);
    try {
      const api = await getApi();
      await api.vote(postId, sideTrue);
      setVoted(sideTrue);
      if (sideTrue) setTCount((x) => x + 1); else setFCount((x) => x + 1);
    } catch (e: any) {
      Alert.alert('Vote failed', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    try {
      const message = `${title} — ${typeof postId === 'string' ? postId : `#${postId}`}`;
      await Share.share({ message });
    } catch {}
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ gap: 6, flex: 1 }}>
          {trending && <Badge label="TRENDING" variant="solid" />}
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.authorRow}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : null}
            <Text style={styles.subtext}>{author} • {time}</Text>
          </View>
        </View>
        <View style={styles.voteTotals}>
          <Text style={[styles.count, { color: '#16A34A' }]}>{tCount}</Text>
          <Text style={[styles.count, { color: '#DC2626' }]}>{fCount}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Button label="True" onPress={() => onVote(true)} />
        <TouchableOpacity style={[styles.btnSecondary, (busy || voted !== null) && { opacity: 0.6 }]} disabled={busy || voted !== null} onPress={() => onVote(false)}>
          <Feather name="thumbs-down" size={16} color="#111827" />
          <Text style={styles.btnSecondaryText}>Fake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.roundIcon} onPress={onShare}>
          <Feather name="share-2" size={18} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          {!!footer && voted === null && <Text style={styles.subtext}>{footer}</Text>}
          {voted !== null && (
            <Text style={styles.subtext}>Voted {voted ? 'True' : 'Fake'}</Text>
          )}
        </View>
      </View>

      <View style={styles.metaRow}>
        {['Comments', 'View Count', 'Save', 'Report'].map((m) => (
          <Text key={m} style={styles.metaText}>{m}</Text>
        ))}
      </View>
    </View>
  );
}

function FollowRow({ label }: { label: string }) {
  return (
    <View style={styles.followRow}>
      <Text style={styles.bodyText}>{label}</Text>
      <TouchableOpacity style={styles.btnOutline} onPress={() => {}}>
        <Text style={styles.btnOutlineText}>Follow</Text>
      </TouchableOpacity>
    </View>
  );
}

function AuthorRow({ name, avatar }: { name: string; avatar: string }) {
  return (
    <View style={styles.authorItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <Text style={styles.bodyText}>{name}</Text>
      </View>
      <TouchableOpacity style={styles.btnOutline} onPress={() => {}}>
        <Text style={styles.btnOutlineText}>Follow</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 24 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerRight: { marginTop: 10, gap: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10,
  },
  input: { flex: 1, fontSize: 14, color: '#111827' },

  body: { padding: 16, gap: 16 },

  statsCard: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 12, gap: 6,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },

  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  subtext: { fontSize: 12, color: '#6B7280' },
  bodyText: { fontSize: 14, color: '#111827' },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F3F4F6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
  },
  iconBtnText: { color: '#111827', fontWeight: '600' },

  tabs: {
    flexDirection: 'row', gap: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9999 },
  tabActive: { backgroundColor: '#111827' },
  tabText: { fontSize: 14, color: '#111827' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9999 },
  badgeSolid: { backgroundColor: '#111827' },
  badgeNeutral: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 12 },
  badgeTextSolid: { color: '#FFFFFF', fontWeight: '600' },
  badgeTextNeutral: { color: '#111827' },

  card: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 14, gap: 12,
  },
  cardTop: { flexDirection: 'row', gap: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 24, height: 24, borderRadius: 12 },

  voteTotals: { alignItems: 'flex-end', gap: 4 },
  count: { fontSize: 16, fontWeight: '700' },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnText: { color: '#FFFFFF', fontWeight: '600' },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  btnSecondaryText: { color: '#111827', fontWeight: '600' },
  roundIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },

  metaRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 6, borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metaText: { fontSize: 14, color: '#111827' },

  followGrid: { gap: 10 },
  followRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    padding: 10, borderRadius: 10,
  },
  btnOutline: {
    borderWidth: 1, borderColor: '#111827', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12,
  },
  btnOutlineText: { color: '#111827', fontWeight: '600' },

  authorItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    padding: 10, borderRadius: 10,
  },
});