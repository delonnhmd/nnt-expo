import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyVoteEntry, VOTE_TRUE, VOTE_FAKE } from './useVoting';

export interface User {
  address: string;
  displayName?: string;
  nntBalance?: string;
  gnntBalance?: string;
  postsCount?: number;
  votesCount?: number;
  rewardsEarned?: string;
  joinedAt?: string;
  isVerified?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalVotes: number;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({ totalUsers: 0, activeUsers: 0, totalPosts: 0, totalVotes: 0 });
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [myVotes, setMyVotes] = useState<MyVoteEntry[]>([]);

  const loadUser = useCallback(async (address: string): Promise<User | null> => {
    try {
      // In a real app, this would call backend API
      // For now, simulate user data
      const user: User = {
        address,
        displayName: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
        nntBalance: '100.50',
        gnntBalance: '25.75',
        postsCount: 12,
        votesCount: 45,
        rewardsEarned: '15.25',
        joinedAt: new Date().toISOString(),
        isVerified: Math.random() > 0.5
      };
      
      return user;
    } catch (error) {
      console.warn('Failed to load user:', error);
      return null;
    }
  }, []);

  const loadMyVotes = useCallback(async (address: string) => {
    try {
      const key = `myVotes:${address.toLowerCase()}`;
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        setMyVotes(JSON.parse(raw));
      } else {
        setMyVotes([]);
      }
    } catch (e) {
      console.warn('Failed to load my votes:', e);
      setMyVotes([]);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate loading users
      const mockUsers: User[] = [
        {
          address: '0x742d35Cc6473C4b7f2b1234567890123456789ab',
          displayName: 'Alice',
          nntBalance: '1500.75',
          gnntBalance: '200.50',
          postsCount: 25,
          votesCount: 120,
          rewardsEarned: '45.25',
          isVerified: true
        },
        {
          address: '0x987fcdeb6473C4b7f2b9876543210987654321cd',
          displayName: 'Bob',
          nntBalance: '750.25',
          gnntBalance: '100.75',
          postsCount: 15,
          votesCount: 80,
          rewardsEarned: '25.50',
          isVerified: false
        }
      ];
      
      setUsers(mockUsers);
      setStats({
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter(u => u.postsCount && u.postsCount > 0).length,
        totalPosts: mockUsers.reduce((sum, u) => sum + (u.postsCount || 0), 0),
        totalVotes: mockUsers.reduce((sum, u) => sum + (u.votesCount || 0), 0)
      });
    } catch (error) {
      console.warn('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    setLoading(true);
    try {
      // Simulate search
      const filtered = users.filter(user => 
        user.address.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.warn('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [users]);

  const updateUser = useCallback(async (address: string, updates: Partial<User>) => {
    try {
      setUsers(prev => prev.map(user => 
        user.address === address ? { ...user, ...updates } : user
      ));
      return true;
    } catch (error) {
      console.warn('Failed to update user:', error);
      return false;
    }
  }, []);

  return {
    users,
    stats,
    searchResults,
    loading,
    loadUser,
    loadUsers,
    searchUsers,
    updateUser,
    // votes
    myVotes,
    loadMyVotes,
    VOTE_TRUE,
    VOTE_FAKE
  };
}
