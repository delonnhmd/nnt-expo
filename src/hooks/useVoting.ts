import { useState, useCallback, useEffect } from 'react';
import { useWallet } from './useWallet';
import { useTransactions } from './useTransactions';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoteResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Numeric vote codes (start at 101 as requested)
export const VOTE_TRUE = 101;
export const VOTE_FAKE = 102;

export type VoteCode = typeof VOTE_TRUE | typeof VOTE_FAKE;

export interface PostVotes {
  trueVotes: number;
  fakeVotes: number;
  userVote?: VoteCode | null;
}

export interface MyVoteEntry {
  postId: number;
  vote: VoteCode; // 101 = TRUE, 102 = FAKE
  at: string; // ISO timestamp
}

export function useVoting() {
  const { address } = useWallet();
  const tx = useTransactions();
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState<Record<number, PostVotes>>({});
  const [myVotes, setMyVotes] = useState<MyVoteEntry[]>([]);

  const storageKey = address ? `myVotes:${address.toLowerCase()}` : '';

  const loadMyVotes = useCallback(async () => {
    if (!address) return;
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        const parsed: MyVoteEntry[] = JSON.parse(raw);
        setMyVotes(parsed);
      } else {
        setMyVotes([]);
      }
    } catch (e) {
      console.warn('Failed to load my votes:', e);
    }
  }, [address, storageKey]);

  const persistMyVotes = useCallback(async (entries: MyVoteEntry[]) => {
    if (!address) return;
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to persist my votes:', e);
    }
  }, [address, storageKey]);

  useEffect(() => {
    // load on wallet change
    loadMyVotes();
  }, [loadMyVotes]);

  const addMyVote = useCallback(async (postId: number, vote: VoteCode) => {
    const entry: MyVoteEntry = { postId, vote, at: new Date().toISOString() };
    setMyVotes(prev => {
      const next = [...prev, entry];
      // persist async (fire-and-forget)
      persistMyVotes(next);
      return next;
    });
  }, [persistMyVotes]);

  const voteTrue = useCallback(async (postId: number): Promise<VoteResult> => {
    if (!address) throw new Error('Wallet not connected');
    
    setLoading(true);
    try {
      const sent = await tx.voteTrue(postId);
      console.log('Vote TRUE sent:', sent);
      const result = { success: true, txHash: sent?.hash } as VoteResult;
      // Update local vote state optimistically
      setVotes(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          userVote: VOTE_TRUE,
          trueVotes: (prev[postId]?.trueVotes || 0) + 1
        }
      }));
      // Record in my votes history
      await addMyVote(postId, VOTE_TRUE);
      
      return result;
    } catch (error: any) {
      console.warn('Vote TRUE failed:', error);
      return { success: false, error: error.message || 'Vote failed' };
    } finally {
      setLoading(false);
    }
  }, [address, tx, addMyVote]);

  const voteFake = useCallback(async (postId: number): Promise<VoteResult> => {
    if (!address) throw new Error('Wallet not connected');
    
    setLoading(true);
    try {
      const sent = await tx.voteFake(postId);
      console.log('Vote FAKE sent:', sent);
      const result = { success: true, txHash: sent?.hash } as VoteResult;
      // Update local vote state optimistically
      setVotes(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          userVote: VOTE_FAKE,
          fakeVotes: (prev[postId]?.fakeVotes || 0) + 1
        }
      }));
      // Record in my votes history
      await addMyVote(postId, VOTE_FAKE);
      
      return result;
    } catch (error: any) {
      console.warn('Vote FAKE failed:', error);
      return { success: false, error: error.message || 'Vote failed' };
    } finally {
      setLoading(false);
    }
  }, [address, tx, addMyVote]);

  const getVotes = useCallback((postId: number): PostVotes => {
    return votes[postId] || { trueVotes: 0, fakeVotes: 0, userVote: null };
  }, [votes]);

  const loadVotes = useCallback(async (postId: number) => {
    try {
      // In a real app, load votes from backend
      // For now, simulate some data
      setVotes(prev => ({
        ...prev,
        [postId]: prev[postId] || { trueVotes: 5, fakeVotes: 2, userVote: null }
      }));
    } catch (error) {
      console.warn('Failed to load votes:', error);
    }
  }, []);

  return {
    voteTrue,
    voteFake,
    getVotes,
    loadVotes,
    loading,
    votes,
    // my votes APIs
    myVotes,
    loadMyVotes,
    VOTE_TRUE,
    VOTE_FAKE
  };
}
