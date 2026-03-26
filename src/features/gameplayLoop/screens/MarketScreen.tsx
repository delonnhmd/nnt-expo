import React from 'react';
import { StyleSheet, View } from 'react-native';

import MarketOverviewCard from '@/components/gameplay/MarketOverviewCard';
import PriceTrendsCard from '@/components/gameplay/PriceTrendsCard';
import StockMarketCard from '@/components/gameplay/StockMarketCard';
import { OnboardingHighlight } from '@/components/onboarding';
import EmptyStateView from '@/components/ui/EmptyStateView';
import { theme } from '@/design/theme';
import { useOnboarding } from '@/features/onboarding';
import { useScreenTimer } from '@/hooks/useScreenTimer';

import { useGameplayLoop } from '../context';
import {
  GameplayStickyActionArea,
  GameplaySummaryCard,
  GameplayTrendChip,
} from '../components/GameplayUIParts';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

export default function MarketScreen() {
  useScreenTimer('market');
  const loop = useGameplayLoop();
  const onboarding = useOnboarding();
  const guidedMarketActive = onboarding.isActive && onboarding.currentStep?.route === 'market';
  const simplified = onboarding.isSimplifiedMode;
  const marketMood = loop.economySummary?.market_overview.current_market_mood || 'unknown';
  const basketCount = loop.economySummary?.price_trends.items.length || 0;
  const stockCount = loop.stockMarket?.stocks.length || 0;
  const holdings = loop.stockMarket?.portfolio.holdings_count || 0;

  return (
    <GameplayLoopScaffold
      title="Market"
      subtitle="Read basket signals, then evaluate optional stock exposure"
      activeNavKey="market"
      footer={guidedMarketActive ? null : (
        <GameplayStickyActionArea
          summary="Baskets shape daily costs and margins. Stocks are optional upside only."
          secondaryLabel="Open Business"
          onSecondaryPress={() => {
            onboarding.navigateTo('business');
          }}
          primaryLabel="Back To Work"
          onPrimaryPress={() => {
            onboarding.navigateTo('work');
          }}
        />
      )}
    >
      <GameplaySummaryCard
        eyebrow="Market snapshot"
        title="Baskets vs Stocks"
        subtitle="Baskets affect daily costs. Stocks are optional extra income."
      >
        <View style={styles.chipRow}>
          <GameplayTrendChip label="Market mood" value={marketMood} tone="info" />
          <GameplayTrendChip label="Baskets" value={String(basketCount)} tone="neutral" />
          <GameplayTrendChip label="Stocks" value={String(stockCount)} tone="neutral" />
          <GameplayTrendChip label="Holdings" value={String(holdings)} tone={holdings > 0 ? 'positive' : 'warning'} />
        </View>
      </GameplaySummaryCard>

      {loop.economySummary ? (
        <OnboardingHighlight target="market-price-movement">
          <GameplaySummaryCard
            eyebrow="Baskets"
            title="Why prices change today"
            subtitle="These moves affect what you pay for food, rent, and goods."
          >
            <MarketOverviewCard overview={loop.economySummary.market_overview} />
            <PriceTrendsCard trends={loop.economySummary.price_trends} />
          </GameplaySummaryCard>
        </OnboardingHighlight>
      ) : (
        <EmptyStateView
          title="Economy snapshot unavailable"
          subtitle="Refresh to load market and basket movement."
        />
      )}

      {!simplified && loop.stockMarket ? (
        <GameplaySummaryCard
          eyebrow="Stocks"
          title="Optional Stock Lane"
          subtitle="Use this after core survival and cash-buffer decisions are covered."
        >
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
        </GameplaySummaryCard>
      ) : null}
    </GameplayLoopScaffold>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});
