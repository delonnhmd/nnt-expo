import React from 'react';
import { StyleSheet, Text } from 'react-native';

import MarketOverviewCard from '@/components/gameplay/MarketOverviewCard';
import PriceTrendsCard from '@/components/gameplay/PriceTrendsCard';
import StockMarketCard from '@/components/gameplay/StockMarketCard';
import EmptyStateView from '@/components/ui/EmptyStateView';
import SectionCard from '@/components/ui/SectionCard';
import { theme } from '@/design/theme';

import { useGameplayLoop } from '../context';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

export default function MarketScreen() {
  const loop = useGameplayLoop();

  return (
    <GameplayLoopScaffold
      title="Market"
      subtitle="Basket and stock movement"
      activeNavKey="market"
    >
      <SectionCard
        title="Market Notes"
        summary="Opportunity and risk indicators from backend economy snapshot."
      >
        <Text style={styles.copy}>{loop.economySummary?.explainer.this_week_focus || 'No weekly focus available.'}</Text>
        <Text style={styles.copy}>Opportunity: {loop.economySummary?.player_opportunities?.[0] || 'No short-term upside flagged.'}</Text>
        <Text style={styles.copy}>Risk: {loop.economySummary?.player_warnings?.[0] || 'No immediate warning flagged.'}</Text>
      </SectionCard>

      {loop.economySummary ? (
        <>
          <MarketOverviewCard overview={loop.economySummary.market_overview} />
          <PriceTrendsCard trends={loop.economySummary.price_trends} />
        </>
      ) : (
        <EmptyStateView
          title="Economy snapshot unavailable"
          subtitle="Refresh to load market and basket movement."
        />
      )}

      {loop.stockMarket ? (
        <StockMarketCard
          market={loop.stockMarket}
          sessionActive={loop.dailySession.sessionStatus === 'active'}
          pendingTradeStockId={loop.pendingTrade?.stockId || null}
          pendingTradeSide={loop.pendingTrade?.side || null}
          onBuyOne={(stockId) => {
            void loop.buyOneStock(stockId);
          }}
          onSellOne={(stockId) => {
            void loop.sellOneStock(stockId);
          }}
          onSellAll={(stockId, quantity) => {
            void loop.sellAllStock(stockId, quantity);
          }}
        />
      ) : null}
    </GameplayLoopScaffold>
  );
}

const styles = StyleSheet.create({
  copy: {
    ...theme.typography.bodySm,
    color: theme.color.textSecondary,
  },
});
