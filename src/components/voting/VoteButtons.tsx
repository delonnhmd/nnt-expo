import React from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { useVoting, VOTE_TRUE, VOTE_FAKE } from '@/hooks/useVoting';
import { useWallet } from '@/hooks/useWallet';
import { useDebt } from '@/hooks/useDebt';

interface VoteButtonsProps {
  postId: number;
  style?: any;
}

export default function VoteButtons({ postId, style }: VoteButtonsProps) {
  const { connected, address } = useWallet();
  const { voteTrue, voteFake, getVotes, loading } = useVoting();
  const votes = getVotes(postId);
  const { outstanding: debt } = useDebt();
  const locked = debt > 0;

  const handleVoteTrue = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      const result = await voteTrue(postId);
      if (result.success) {
        alert('✅ Vote TRUE successful!');
      } else {
        alert(`❌ Vote failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`❌ Vote failed: ${error.message}`);
    }
  };

  const handleVoteFake = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      const result = await voteFake(postId);
      if (result.success) {
        alert('✅ Vote FAKE successful!');
      } else {
        alert(`❌ Vote failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`❌ Vote failed: ${error.message}`);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Vote on Post #{postId}</Text>
      {locked && (
        <Text style={styles.warning}>
          🔒 Your account has {debt} NNT debt. Voting is locked. Repay from Rewards → Debt.
        </Text>
      )}
      
      <View style={styles.voteRow}>
        <Button
          title={loading ? "Voting..." : `👍 TRUE (${votes.trueVotes})`}
          onPress={handleVoteTrue}
          disabled={!connected || loading || votes.userVote === VOTE_TRUE || locked}
          color={votes.userVote === VOTE_TRUE ? '#4CAF50' : undefined}
        />
        
        <View style={styles.spacer} />
        
        <Button
          title={loading ? "Voting..." : `👎 FAKE (${votes.fakeVotes})`}
          onPress={handleVoteFake}
          disabled={!connected || loading || votes.userVote === VOTE_FAKE || locked}
          color={votes.userVote === VOTE_FAKE ? '#f44336' : undefined}
        />
      </View>
      
      {votes.userVote && (
        <Text style={styles.userVote}>
          You voted: {votes.userVote === VOTE_TRUE ? 'TRUE (101)' : 'FAKE (102)'}
        </Text>
      )}
      
      {!connected && (
        <Text style={styles.warning}>Connect wallet to vote</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  voteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer: {
    width: 12,
  },
  userVote: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  warning: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#ff6600',
  },
});
