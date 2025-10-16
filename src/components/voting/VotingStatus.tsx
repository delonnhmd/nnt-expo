import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useVoting } from '@/hooks/useVoting';

interface VotingStatusProps {
  postId: number;
}

export default function VotingStatus({ postId }: VotingStatusProps) {
  const { getVotes } = useVoting();
  const votes = getVotes(postId);
  
  const total = votes.trueVotes + votes.fakeVotes;
  const truePercent = total > 0 ? (votes.trueVotes / total) * 100 : 0;
  const fakePercent = total > 0 ? (votes.fakeVotes / total) * 100 : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voting Results</Text>
      
      <View style={styles.resultRow}>
        <Text style={styles.label}>👍 TRUE:</Text>
        <Text style={styles.count}>{votes.trueVotes}</Text>
        <Text style={styles.percent}>({truePercent.toFixed(1)}%)</Text>
      </View>
      
      <View style={styles.resultRow}>
        <Text style={styles.label}>👎 FAKE:</Text>
        <Text style={styles.count}>{votes.fakeVotes}</Text>
        <Text style={styles.percent}>({fakePercent.toFixed(1)}%)</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.trueBar, { width: `${truePercent}%` }]} />
          <View style={[styles.fakeBar, { width: `${fakePercent}%` }]} />
        </View>
      </View>
      
      <Text style={styles.total}>Total Votes: {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    flex: 1,
    fontSize: 14,
  },
  count: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'right',
  },
  percent: {
    fontSize: 12,
    color: '#666',
    minWidth: 50,
    textAlign: 'right',
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  trueBar: {
    backgroundColor: '#4CAF50',
    height: '100%',
  },
  fakeBar: {
    backgroundColor: '#f44336',
    height: '100%',
  },
  total: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});
