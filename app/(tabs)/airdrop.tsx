import { Image } from 'expo-image';
import { Platform, StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import PostList from '@/components/PostList';
import { usePosts } from '@/hooks';
import React from 'react';
import { useWallet } from '@/hooks';
import { getApi } from '@/lib/api';

import '@walletconnect/react-native-compat';

export default function TabTwoScreen() {
  const posts = usePosts();
  const { address, provider } = useWallet();
  const [claiming, setClaiming] = React.useState(false);
  const [claimData, setClaimData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { posts.loadFeed(); }, [posts.loadFeed]);

  // Check if user has claimable airdrop on mount
  React.useEffect(() => {
    if (!address) return;
    (async () => {
      try {
        setLoading(true);
        const api = await getApi();
        // Try NNT epoch 100 first
        const res = await api.airdropClaimable('nnt', 100, address);
        if (res?.ok && !res?.isClaimed) {
          setClaimData({ token: 'nnt', epoch: 100, ...res });
        }
      } catch (e: any) {
        console.log('[AIRDROP] Check failed:', e?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

  const onClaim = async () => {
    if (!address || !claimData || claiming) return;
    setClaiming(true);
    try {
      const api = await getApi();
      // Get prepared tx
      const txData = await api.txAirdropClaim(address, claimData.token, claimData.epoch, address);
      if (!txData?.ok) throw new Error(txData?.error || 'Failed to prepare claim tx');
      if (txData?.status === 'already_claimed') {
        Alert.alert('Already claimed', 'You have already claimed this airdrop.');
        setClaimData(null);
        return;
      }
      // Send via wallet using provider
      const browserProvider = provider();
      if (!browserProvider) throw new Error('No provider available');
      const signer = await browserProvider.getSigner();
      const tx = {
        to: txData.to,
        data: txData.data,
        value: txData.value || '0x0',
      };
      const receipt = await signer.sendTransaction(tx);
      await receipt.wait();
      Alert.alert('Success', 'Claim confirmed! NNT credited to your wallet.');
      setClaimData(null);
    } catch (e: any) {
      Alert.alert('Claim failed', e?.message || String(e));
    } finally {
      setClaiming(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Airdrop
        </ThemedText>
      </ThemedView>

      {!address && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connect wallet to check eligibility</Text>
          <Text style={styles.cardText}>Connect your wallet on the main page to see if you have claimable tokens.</Text>
        </View>
      )}

      {address && loading && (
        <View style={styles.card}>
          <ActivityIndicator size="small" color="#111827" />
          <Text style={styles.cardText}>Checking eligibility…</Text>
        </View>
      )}

      {address && !loading && !claimData && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No claimable airdrop</Text>
          <Text style={styles.cardText}>You don't have any pending airdrops. Check back later or complete tasks to earn tokens.</Text>
        </View>
      )}

      {address && claimData && (
        <View style={[styles.card, styles.cardClaim]}>
          <Text style={styles.cardTitle}>🎉 You have a claimable airdrop!</Text>
          <View style={styles.claimRow}>
            <Text style={styles.cardText}>Token:</Text>
            <Text style={styles.cardValue}>{claimData.token.toUpperCase()}</Text>
          </View>
          <View style={styles.claimRow}>
            <Text style={styles.cardText}>Amount:</Text>
            <Text style={styles.cardValue}>{(Number(claimData.amount || 0) / 1e18).toFixed(2)}</Text>
          </View>
          <View style={styles.claimRow}>
            <Text style={styles.cardText}>Epoch:</Text>
            <Text style={styles.cardValue}>{claimData.epoch}</Text>
          </View>
          <TouchableOpacity
            style={[styles.button, claiming && styles.buttonDisabled]}
            onPress={onClaim}
            disabled={claiming}>
            {claiming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Claim Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ThemedText style={{ marginTop: 16 }}>After claiming, you can use your NNT to post and vote.</ThemedText>

      <Collapsible title="Feed">
        <PostList data={posts.feed} />
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginVertical: 8,
  },
  cardClaim: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cardText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
