import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { useWallet } from '@/hooks/useWallet';
import { useUsers } from '@/hooks/useUsers';
import { useBackend } from '@/hooks/useBackend';
import { shortAddr } from '@/utils/format';

export default function AdminDashboard() {
  const { connected, address } = useWallet();
  const { stats, users, loadUsers } = useUsers();
  const backend = useBackend();

  useEffect(() => {
    if (connected) {
      loadUsers();
    }
  }, [connected, loadUsers]);

  const handleAllocateCredits = async () => {
    if (!connected || !address) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    try {
      // In a real app, this would call backend admin endpoint
      Alert.alert('Success', 'Ad credits allocated to all users!');
    } catch (error: any) {
      Alert.alert('Error', `Failed to allocate credits: ${error.message}`);
    }
  };

  const handleAirdrop = async (tokenType: 'NNT' | 'GNNT') => {
    if (!connected || !address) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    try {
      if (tokenType === 'NNT') {
        await backend.airdropNnt(address, 1000);
      } else {
        await backend.airdropGnnt(address, 500);
      }
      Alert.alert('Success', `${tokenType} airdrop successful!`);
    } catch (error: any) {
      Alert.alert('Error', `Airdrop failed: ${error.message}`);
    }
  };

  if (!connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.warning}>Please connect your wallet to access admin functions</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Connected: {shortAddr(address!)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Platform Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalPosts}</Text>
            <Text style={styles.statLabel}>Total Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalVotes}</Text>
            <Text style={styles.statLabel}>Total Votes</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎁 Airdrop Actions</Text>
        <View style={styles.buttonRow}>
          <Button
            title="Airdrop NNT (1000)"
            onPress={() => handleAirdrop('NNT')}
          />
          <View style={styles.spacer} />
          <Button
            title="Airdrop GNNT (500)"
            onPress={() => handleAirdrop('GNNT')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📺 Ad Management</Text>
        <Button
          title="Allocate Ad Credits (All Users)"
          onPress={handleAllocateCredits}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Recent Users ({users.length})</Text>
        {users.slice(0, 5).map((user, index) => (
          <View key={user.address} style={styles.userItem}>
            <View>
              <Text style={styles.userName}>
                {user.displayName || shortAddr(user.address)}
              </Text>
              <Text style={styles.userAddress}>{shortAddr(user.address)}</Text>
            </View>
            <View style={styles.userStats}>
              <Text style={styles.userStat}>Posts: {user.postsCount || 0}</Text>
              <Text style={styles.userStat}>Votes: {user.votesCount || 0}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActions}>
          <Button title="Refresh Stats" onPress={loadUsers} />
          <View style={styles.spacer} />
          <Button title="Export Data" onPress={() => Alert.alert('Info', 'Export feature coming soon!')} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  warning: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#ff6600',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spacer: {
    width: 12,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
  },
  userAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  userStats: {
    alignItems: 'flex-end',
  },
  userStat: {
    fontSize: 12,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
