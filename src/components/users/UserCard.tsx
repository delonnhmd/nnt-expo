import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User } from '@/hooks/useUsers';
import { shortAddr } from '@/utils/format';

interface UserCardProps {
  user: User;
  onPress?: (user: User) => void;
}

export default function UserCard({ user, onPress }: UserCardProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress?.(user)}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>
            {user.displayName || shortAddr(user.address)}
          </Text>
          <Text style={styles.address}>{shortAddr(user.address)}</Text>
        </View>
        
        {user.isVerified && (
          <Text style={styles.verified}>✅</Text>
        )}
      </View>
      
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.nntBalance || '0'}</Text>
          <Text style={styles.statLabel}>NNT</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.postsCount || 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.votesCount || 0}</Text>
          <Text style={styles.statLabel}>Votes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  address: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  verified: {
    fontSize: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
