import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import BusinessMarginsCard from '@/components/gameplay/BusinessMarginsCard';
import BusinessOperationsCard from '@/components/gameplay/BusinessOperationsCard';
import BusinessPlanCard from '@/components/gameplay/BusinessPlanCard';
import EmptyStateView from '@/components/ui/EmptyStateView';
import InlineStat from '@/components/ui/InlineStat';
import SectionCard from '@/components/ui/SectionCard';
import { theme } from '@/design/theme';
import { formatMoney } from '@/lib/gameplayFormatters';

import { useGameplayLoop } from '../context';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

function canonicalActionKey(actionKey: string): string {
  const raw = String(actionKey || '').toLowerCase().trim();
  if (!raw) return '';
  if (raw === 'operate_business' || (raw.includes('operate') && raw.includes('business'))) return 'operate_business';
  return raw;
}

export default function BusinessScreen() {
  const loop = useGameplayLoop();
  const activeBusiness = useMemo(
    () => {
      const businesses = loop.businesses?.businesses || [];
      return businesses.find((item) => item.is_active) || businesses[0] || null;
    },
    [loop.businesses?.businesses],
  );

  const marginsForActive = useMemo(() => {
    if (!activeBusiness || !loop.economySummary) return null;
    return loop.economySummary.business_margins.items.find(
      (item) => item.business_key === activeBusiness.business_type,
    ) || null;
  }, [activeBusiness, loop.economySummary]);

  const planForActive = useMemo(() => {
    if (!activeBusiness || !loop.businessPlan) return null;
    return loop.businessPlan.items.find((item) => item.business_key === activeBusiness.business_type) || null;
  }, [activeBusiness, loop.businessPlan]);

  const operatedToday = loop.dailySession.actionsTakenToday.some(
    (entry) => canonicalActionKey(entry.action_key) === 'operate_business' && entry.success,
  );

  return (
    <GameplayLoopScaffold
      title="Business"
      subtitle="Operations and margin signals"
      activeNavKey="business"
    >
      <SectionCard
        title="Business Summary"
        summary="Backend business and profitability snapshot."
      >
        <InlineStat
          label="Active Businesses"
          value={String(loop.businesses?.profit_snapshot.active_businesses ?? 0)}
        />
        <InlineStat
          label="Latest Daily Profit"
          value={formatMoney(loop.businesses?.profit_snapshot.latest_daily_profit_xgp ?? 0)}
          tone={(loop.businesses?.profit_snapshot.latest_daily_profit_xgp ?? 0) >= 0 ? 'positive' : 'danger'}
        />
        <InlineStat
          label="7d Profit"
          value={formatMoney(loop.businesses?.profit_snapshot.trailing_7d_profit_xgp ?? 0)}
          tone={(loop.businesses?.profit_snapshot.trailing_7d_profit_xgp ?? 0) >= 0 ? 'positive' : 'danger'}
        />
        <Text style={styles.copy}>
          {loop.economySummary?.explainer.suggested_growth_move || 'No growth guidance available.'}
        </Text>
      </SectionCard>

      {loop.economySummary ? (
        <BusinessMarginsCard margins={loop.economySummary.business_margins} />
      ) : (
        <EmptyStateView
          title="Business margins unavailable"
          subtitle="Refresh to fetch margin outlook."
        />
      )}

      {loop.businessPlan ? <BusinessPlanCard plan={loop.businessPlan} /> : null}

      {activeBusiness ? (
        <BusinessOperationsCard
          activeRecord={activeBusiness}
          profitSnapshot={loop.businesses?.profit_snapshot || null}
          margins={marginsForActive}
          plan={planForActive}
          operatedToday={operatedToday}
          sessionActive={loop.dailySession.sessionStatus === 'active'}
          isExecuting={loop.executingAction && canonicalActionKey(loop.busyActionKey || '') === 'operate_business'}
          onOperate={() => {
            void loop.operateBusiness();
          }}
        />
      ) : (
        <EmptyStateView
          title="No business yet"
          subtitle="Operate business actions unlock once you activate a business profile."
        />
      )}
    </GameplayLoopScaffold>
  );
}

const styles = StyleSheet.create({
  copy: {
    ...theme.typography.bodySm,
    color: theme.color.textSecondary,
  },
});
