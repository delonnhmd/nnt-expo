import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import { useUsers, User } from '@/hooks/useUsers';
import { shortAddr } from '@/utils/format';

interface UserProfileProps {
  address: string;
  showActions?: boolean;
}

export default function UserProfile({ address, showActions = true }: UserProfileProps) {
  const { loadUser, myVotes, loadMyVotes, VOTE_TRUE, VOTE_FAKE } = useUsers();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const userData = await loadUser(address);
        setUser(userData);
      } catch (error) {
        console.warn('Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchUser();
      // load vote history for this user
      loadMyVotes(address);
    }
  }, [address, loadUser, loadMyVotes]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading user profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.displayName}>
          {user.displayName || shortAddr(address)}
        </Text>
        <Text style={styles.address}>{shortAddr(address)}</Text>
        {user.isVerified && (
          <Text style={styles.verified}>✅ Verified</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Balances</Text>
        <View style={styles.row}>
          <Text style={styles.label}>NNT:</Text>
          <Text style={styles.value}>{user.nntBalance || '0'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>GNNT:</Text>
          <Text style={styles.value}>{user.gnntBalance || '0'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Rewards Earned:</Text>
          <Text style={styles.value}>{user.rewardsEarned || '0'} NNT</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Posts Created:</Text>
          <Text style={styles.value}>{user.postsCount || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Votes Cast:</Text>
          <Text style={styles.value}>{user.votesCount || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Member Since:</Text>
          <Text style={styles.value}>
            {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
      </View>

      {/* My Votes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Votes</Text>
        {myVotes && myVotes.length > 0 ? (
          myVotes.slice().reverse().map((v, idx) => (
            <View key={`${v.postId}-${idx}`} style={styles.row}>
              <Text style={styles.label}>Post #{v.postId}</Text>
              <Text style={styles.value}>
                {v.vote === VOTE_TRUE ? 'TRUE' : 'FAKE'} ({v.vote})
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ color: '#666' }}>No votes yet</Text>
        )}
      </View>

      {showActions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              title="View Posts"
              onPress={() => alert(`Viewing posts for ${shortAddr(address)}`)}
            />
            <View style={styles.spacer} />
            <Button
              title="Send Tip"
              onPress={() => alert(`Send tip to ${shortAddr(address)}`)}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loading: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  error: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#ff4444',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  verified: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  spacer: {
    width: 12,
  },
});
