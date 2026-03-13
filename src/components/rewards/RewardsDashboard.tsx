import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, RefreshControl, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useWallet } from '@/hooks/useWallet';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useBackend } from '@/hooks/useBackend';
import { useDebt } from '@/hooks/useDebt';
import { NNT_ADDRESS, GNNT_ADDRESS, NNT_DECIMALS, GNNT_DECIMALS } from '@/constants';

interface RewardSummary {
  adRewardsEarned: number;
  votingRewards: number;
  postRewards: number;
  totalEarned: number;
  adCreditsUsed: number;
  adCreditsRemaining: number;
  nntPoints?: number;
  gnntPoints?: number;
  debtOutstanding?: number;
  pendingReceivablesTotal?: number;
}

export default function RewardsDashboard() {
  const { connected, address } = useWallet();
  const backend = useBackend();
  const debt = useDebt();
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<RewardSummary>({
    adRewardsEarned: 0,
    votingRewards: 0,
    postRewards: 0,
    totalEarned: 0,
    adCreditsUsed: 0,
    adCreditsRemaining: 10
  });
  const [repayNnt, setRepayNnt] = useState<string>('');
  const [repayGnnt, setRepayGnnt] = useState<string>('');

  const nnt = useTokenBalance({ 
    token: NNT_ADDRESS, 
    address, 
    decimals: NNT_DECIMALS, 
    pollMs: 15000 
  });

  const gnnt = useTokenBalance({ 
    token: GNNT_ADDRESS, 
    address, 
    decimals: GNNT_DECIMALS, 
    pollMs: 15000 
  });

  const loadRewardsSummary = async () => {
    if (!address) return;

    try {
      // Load ad credits
      const adCredits = await backend.adCredits(address);
      // Load off-chain points
  const pts = await backend.getPoints(address);
  const debtSnapshot = await debt.refresh();

      // Simulate reward data (in a real app, fetch from backend)
      setSummary({
        adRewardsEarned: 12.5,
        votingRewards: 8.25,
        postRewards: 15.75,
        totalEarned: 36.5,
        adCreditsUsed: adCredits?.usedToday || 0,
        adCreditsRemaining: adCredits?.remaining || 10,
        nntPoints: pts?.nntPoints ?? pts?.nnt ?? 0,
        gnntPoints: pts?.gnntPoints ?? pts?.gnnt ?? 0,
  debtOutstanding: debtSnapshot.outstanding,
  pendingReceivablesTotal: debtSnapshot.pendingTotal,
      });
    } catch (error) {
      console.warn('Failed to load rewards summary:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRewardsSummary();
      await nnt.refresh();
      await gnnt.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (connected && address) {
      loadRewardsSummary();
    }
  }, [connected, address]);

  if (!connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Rewards Dashboard</Text>
        <Text style={styles.warning}>Please connect your wallet to view rewards</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>💰 Rewards Dashboard</Text>

      {/* Current Balances */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Current Balances</Text>
        <View style={styles.balanceGrid}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceValue}>{nnt.formatted || '0'}</Text>
            <Text style={styles.balanceLabel}>NNT Balance</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceValue}>{gnnt.formatted || '0'}</Text>
            <Text style={styles.balanceLabel}>GNNT Balance</Text>
          </View>
        </View>
      </View>

      {/* Off-chain Points (Phase 1) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏅 Points (Phase 1 Off-chain)</Text>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardLabel}>NNT Points:</Text>
          <Text style={styles.rewardValue}>{summary.nntPoints ?? 0}</Text>
        </View>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardLabel}>GNNT Points:</Text>
          <Text style={styles.rewardValue}>{summary.gnntPoints ?? 0}</Text>
        </View>
      </View>

      {/* Debt & Receivables */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚨 Debt & Receivables</Text>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardLabel}>Outstanding Debt:</Text>
          <Text style={[styles.rewardValue, { color: debt.outstanding > 0 ? '#E53935' : '#4CAF50' }]}>
            {debt.outstanding.toFixed(4)} NNT
          </Text>
        </View>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardLabel}>Pending Receivables Owed:</Text>
          <Text style={styles.rewardValue}>{debt.pendingTotal.toFixed(4)} NNT</Text>
        </View>

        <View style={styles.debtListContainer}>
          <Text style={styles.debtListHeader}>Receivables waiting on you</Text>
          {debt.entries.length === 0 ? (
            <Text style={styles.debtListEmpty}>No pending payouts — great job keeping gap penalties in check.</Text>
          ) : (
            debt.entries.map((entry, index) => (
              <View key={`${entry.postId ?? index}`} style={styles.debtListItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.debtListTitle}>Post #{entry.postId ?? '—'}</Text>
                  <Text style={styles.debtListMeta}>{entry.voters} voters waiting</Text>
                </View>
                <Text style={styles.debtListAmount}>{entry.due.toFixed(4)} NNT</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.rewardLabel}>Repay Debt</Text>
          <View style={styles.repayRow}>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="NNT"
              value={repayNnt}
              onChangeText={setRepayNnt}
            />
            <View style={{ width: 8 }} />
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="GNNT"
              value={repayGnnt}
              onChangeText={setRepayGnnt}
            />
            <View style={{ width: 8 }} />
            <Button
              title="Repay"
              onPress={async () => {
                try {
                  const n = parseFloat(repayNnt || '0') || 0;
                  const g = parseFloat(repayGnnt || '0') || 0;
                  const resp = await backend.repayDebt(address!, { nnt: n, gnnt: g });
                  Alert.alert('Repayment', `Paid ${(resp?.paid ?? 0).toFixed(4)} NNT. Outstanding: ${(resp?.outstanding ?? 0).toFixed(4)} NNT`);
                  setRepayNnt('');
                  setRepayGnnt('');
                  await onRefresh();
                } catch (e: any) {
                  Alert.alert('Repayment failed', e?.message || String(e));
                }
              }}
            />
          </View>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Tip: GNNT auto-converts at 100:1 to NNT before repayment.</Text>
        </View>

        {debt.outstanding > 0 && (
          <View style={styles.quickRepayContainer}>
            <Text style={styles.quickRepayTitle}>Quick Repay</Text>
            <View style={styles.quickRepayRow}>
              <TouchableOpacity
                style={[styles.quickRepayButton, { marginRight: 12 }, (summary.nntPoints ?? 0) <= 0 && styles.quickRepayDisabled]}
                disabled={(summary.nntPoints ?? 0) <= 0}
                onPress={async () => {
                  try {
                    const maxNnt = Math.min(debt.outstanding, summary.nntPoints ?? 0);
                    if (maxNnt <= 0) {
                      Alert.alert('No NNT points available');
                      return;
                    }
                    const resp = await backend.repayDebt(address!, { nnt: maxNnt, gnnt: 0 });
                    Alert.alert('Repayment', `Paid ${(resp?.paid ?? 0).toFixed(4)} NNT. Outstanding ${(resp?.outstanding ?? 0).toFixed(4)} NNT`);
                    await onRefresh();
                  } catch (e: any) {
                    Alert.alert('Repay failed', e?.message || String(e));
                  }
                }}
              >
                <Text style={styles.quickRepayText}>Use NNT points</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickRepayButton, (summary.gnntPoints ?? 0) <= 0 && styles.quickRepayDisabled]}
                disabled={(summary.gnntPoints ?? 0) <= 0}
                onPress={async () => {
                  try {
                    const maxGnnt = summary.gnntPoints ?? 0;
                    if (maxGnnt <= 0) {
                      Alert.alert('No GNNT points available');
                      return;
                    }
                    const resp = await backend.repayDebt(address!, { gnnt: maxGnnt });
                    Alert.alert('Repayment', `Paid ${(resp?.paid ?? 0).toFixed(4)} NNT via GNNT. Outstanding ${(resp?.outstanding ?? 0).toFixed(4)} NNT`);
                    await onRefresh();
                  } catch (e: any) {
                    Alert.alert('Repay failed', e?.message || String(e));
                  }
                }}
              >
                <Text style={styles.quickRepayText}>Convert GNNT → NNT</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Rewards Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Rewards Earned</Text>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardLabel}>Ad Rewards (NNT only):</Text>
          <Text style={styles.rewardValue}>{summary.adRewardsEarned} NNT</Text>
        </View>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardLabel}>Voting Rewards:</Text>
          <Text style={styles.rewardValue}>{summary.votingRewards} NNT</Text>
        </View>
        <View style={styles.rewardItem}>
          <Text style={styles.rewardLabel}>Post Rewards:</Text>
          <Text style={styles.rewardValue}>{summary.postRewards} NNT</Text>
        </View>
        <View style={[styles.rewardItem, styles.totalReward]}>
          <Text style={styles.totalLabel}>Total Earned:</Text>
          <Text style={styles.totalValue}>{summary.totalEarned} NNT</Text>
        </View>
      </View>

      {/* Ad Credits Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📺 Ad Credits Today</Text>
        <View style={styles.creditsContainer}>
          <View style={styles.creditsItem}>
            <Text style={styles.creditsValue}>{summary.adCreditsUsed}</Text>
            <Text style={styles.creditsLabel}>Used</Text>
          </View>
          <View style={styles.creditsItem}>
            <Text style={styles.creditsValue}>{summary.adCreditsRemaining}</Text>
            <Text style={styles.creditsLabel}>Remaining</Text>
          </View>
          <View style={styles.creditsItem}>
            <Text style={styles.creditsValue}>
              {summary.adCreditsUsed + summary.adCreditsRemaining}
            </Text>
            <Text style={styles.creditsLabel}>Daily Cap</Text>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(summary.adCreditsUsed / (summary.adCreditsUsed + summary.adCreditsRemaining)) * 100}%` 
              }
            ]} 
          />
        </View>
        <Text style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Ad rewards stop when the 51,000,000 NNT pool is depleted.</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.actionButtons}>
          <Button
            title="Watch Ad"
            onPress={() => {/* Navigate to watch ad */}}
            disabled={summary.adCreditsRemaining <= 0}
          />
          <View style={styles.spacer} />
          <Button
            title="View Posts"
            onPress={() => {/* Navigate to posts */}}
          />
        </View>
        <View style={[styles.actionButtons, { marginTop: 12 }]}>
          <Button
            title="Claim Rewards"
            onPress={() => {/* Navigate to claims */}}
          />
          <View style={styles.spacer} />
          <Button
            title="Refresh Data"
            onPress={onRefresh}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Recent Activity</Text>
        <View style={styles.activityItem}>
          <Text style={styles.activityText}>🎬 Watched ad - earned 0.5 NNT</Text>
          <Text style={styles.activityTime}>2 hours ago</Text>
        </View>
        <View style={styles.activityItem}>
          <Text style={styles.activityText}>👍 Voted TRUE on post #123</Text>
          <Text style={styles.activityTime}>5 hours ago</Text>
        </View>
        <View style={styles.activityItem}>
          <Text style={styles.activityText}>📝 Created new post</Text>
          <Text style={styles.activityTime}>1 day ago</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  warning: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#ff6600',
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  rewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rewardLabel: {
    fontSize: 14,
    color: '#666',
  },
  rewardValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  debtListContainer: {
    marginTop: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
  },
  debtListHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  debtListEmpty: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  debtListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  debtListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  debtListMeta: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  debtListAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53935',
    marginLeft: 12,
  },
  totalReward: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  creditsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  creditsItem: {
    alignItems: 'center',
  },
  creditsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  creditsLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spacer: {
    width: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  repayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickRepayContainer: {
    marginTop: 16,
  },
  quickRepayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  quickRepayRow: {
    flexDirection: 'row',
  },
  quickRepayButton: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickRepayDisabled: {
    backgroundColor: '#9ca3af',
  },
  quickRepayText: {
    color: '#fff',
    fontWeight: '600',
  },
});
