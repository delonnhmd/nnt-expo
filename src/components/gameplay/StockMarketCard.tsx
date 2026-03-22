import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/design/theme';
import { formatMoney } from '@/lib/gameplayFormatters';
import { StockMarketItem, StockMarketSnapshotResponse } from '@/types/stocks';

function changeTone(changePct: number): string {
  if (changePct > 0) return '#166534';
  if (changePct < 0) return '#b91c1c';
  return theme.color.textSecondary;
}

function volatilityLabelText(label: StockMarketItem['volatility_label']): string {
  if (label === 'hot') return 'Hot';
  if (label === 'active') return 'Active';
  return 'Steady';
}

function TradeButton({
  label,
  onPress,
  disabled,
  tone = 'neutral',
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  tone?: 'buy' | 'sell' | 'neutral';
}) {
  const blocked = Boolean(disabled || !onPress);
  const toneStyle = tone === 'buy'
    ? styles.tradeButtonBuy
    : tone === 'sell'
      ? styles.tradeButtonSell
      : styles.tradeButtonNeutral;

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      style={({ pressed }) => [
        styles.tradeButton,
        toneStyle,
        blocked ? styles.tradeButtonDisabled : null,
        pressed && !blocked ? styles.tradeButtonPressed : null,
      ]}
    >
      <Text style={styles.tradeButtonText}>{label}</Text>
    </Pressable>
  );
}

export default function StockMarketCard({
  market,
  sessionActive,
  pendingTradeStockId,
  pendingTradeSide,
  onBuyOne,
  onSellOne,
  onSellAll,
}: {
  market: StockMarketSnapshotResponse;
  sessionActive: boolean;
  pendingTradeStockId: string | null;
  pendingTradeSide: 'buy' | 'sell' | null;
  onBuyOne: (stockId: string) => void;
  onSellOne: (stockId: string) => void;
  onSellAll: (stockId: string, quantity: number) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Sector Stocks</Text>
          <Text style={styles.meta}>
            Day {market.latest_day ?? '?'} closes only. Trades execute against canonical backend price.
          </Text>
        </View>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryPillLabel}>Holdings</Text>
          <Text style={styles.summaryPillValue}>{market.portfolio.holdings_count}</Text>
        </View>
      </View>

      <View style={styles.portfolioGrid}>
        <View style={styles.portfolioTile}>
          <Text style={styles.tileLabel}>Available Cash</Text>
          <Text style={styles.tileValue}>{formatMoney(market.portfolio.available_cash_xgp)}</Text>
        </View>
        <View style={styles.portfolioTile}>
          <Text style={styles.tileLabel}>Market Value</Text>
          <Text style={styles.tileValue}>{formatMoney(market.portfolio.total_market_value_xgp)}</Text>
        </View>
        <View style={styles.portfolioTile}>
          <Text style={styles.tileLabel}>Unrealized P&L</Text>
          <Text style={[styles.tileValue, { color: changeTone(market.portfolio.total_unrealized_pnl_xgp) }]}>
            {formatMoney(market.portfolio.total_unrealized_pnl_xgp)}
          </Text>
        </View>
      </View>

      {!sessionActive ? <Text style={styles.warning}>Day ended. Start next day before placing trades.</Text> : null}

      <View style={styles.list}>
        {market.stocks.map((stock) => {
          const tradeBusy = pendingTradeStockId === stock.stock_id;
          const buyDisabled = !sessionActive || !stock.can_trade || tradeBusy;
          const sellDisabled = !sessionActive || stock.holdings_quantity <= 0 || tradeBusy;
          const isBuying = tradeBusy && pendingTradeSide === 'buy';
          const isSelling = tradeBusy && pendingTradeSide === 'sell';

          return (
            <View key={stock.stock_id} style={styles.stockRow}>
              <View style={styles.stockHeader}>
                <View style={styles.stockTitleWrap}>
                  <Text style={styles.stockName}>{stock.stock_name}</Text>
                  <Text style={styles.stockMeta}>{stock.stock_id} • {stock.sector_key.replace(/_/g, ' ')}</Text>
                </View>
                <View style={styles.priceWrap}>
                  <Text style={styles.stockPrice}>{formatMoney(stock.current_price, 2)}</Text>
                  <Text style={[styles.stockChange, { color: changeTone(stock.daily_change_pct) }]}>
                    {stock.daily_change_pct > 0 ? '+' : ''}{stock.daily_change_pct.toFixed(2)}%
                  </Text>
                </View>
              </View>

              <View style={styles.signalRow}>
                <Text style={styles.signalText}>{stock.sector_signal_summary}</Text>
                <Text style={styles.volatilityBadge}>{volatilityLabelText(stock.volatility_label)}</Text>
              </View>

              <View style={styles.holdingRow}>
                <Text style={styles.holdingText}>Held: {stock.holdings_quantity} share(s)</Text>
                <Text style={styles.holdingText}>Value: {formatMoney(stock.holdings_market_value)}</Text>
                <Text style={[styles.holdingText, { color: changeTone(stock.holdings_unrealized_pnl) }]}>P&L: {formatMoney(stock.holdings_unrealized_pnl)}</Text>
              </View>

              <View style={styles.tradeRow}>
                <TradeButton
                  label={isBuying ? 'Buying...' : 'Buy 1'}
                  onPress={buyDisabled ? undefined : () => onBuyOne(stock.stock_id)}
                  disabled={buyDisabled}
                  tone="buy"
                />
                <TradeButton
                  label={isSelling ? 'Selling...' : 'Sell 1'}
                  onPress={sellDisabled ? undefined : () => onSellOne(stock.stock_id)}
                  disabled={sellDisabled}
                  tone="sell"
                />
                <TradeButton
                  label="Sell All"
                  onPress={sellDisabled ? undefined : () => onSellAll(stock.stock_id, stock.holdings_quantity)}
                  disabled={sellDisabled}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  heading: {
    ...theme.typography.headingSm,
    color: theme.color.textPrimary,
  },
  meta: {
    ...theme.typography.bodySm,
    color: theme.color.textSecondary,
  },
  summaryPill: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfaceAlt,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    minWidth: 72,
  },
  summaryPillLabel: {
    ...theme.typography.caption,
    color: theme.color.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summaryPillValue: {
    ...theme.typography.bodySm,
    color: theme.color.textPrimary,
    fontWeight: '800',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  portfolioTile: {
    flex: 1,
    minWidth: 110,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfaceAlt,
    padding: theme.spacing.sm,
    gap: theme.spacing.xxs,
  },
  tileLabel: {
    ...theme.typography.caption,
    color: theme.color.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  tileValue: {
    ...theme.typography.bodySm,
    color: theme.color.textPrimary,
    fontWeight: '700',
  },
  warning: {
    ...theme.typography.bodySm,
    color: '#b45309',
    fontWeight: '600',
  },
  list: {
    gap: theme.spacing.sm,
  },
  stockRow: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfaceAlt,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  stockTitleWrap: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  stockName: {
    ...theme.typography.label,
    color: theme.color.textPrimary,
    fontWeight: '800',
  },
  stockMeta: {
    ...theme.typography.caption,
    color: theme.color.textSecondary,
  },
  priceWrap: {
    alignItems: 'flex-end',
    gap: theme.spacing.xxs,
  },
  stockPrice: {
    ...theme.typography.bodySm,
    color: theme.color.textPrimary,
    fontWeight: '800',
  },
  stockChange: {
    ...theme.typography.caption,
    fontWeight: '800',
  },
  signalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  signalText: {
    ...theme.typography.bodySm,
    color: theme.color.textSecondary,
    flex: 1,
  },
  volatilityBadge: {
    ...theme.typography.caption,
    color: '#1d4ed8',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  holdingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  holdingText: {
    ...theme.typography.caption,
    color: theme.color.textSecondary,
    fontWeight: '600',
  },
  tradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tradeButton: {
    minHeight: 36,
    minWidth: 82,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tradeButtonNeutral: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
  },
  tradeButtonBuy: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  tradeButtonSell: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  tradeButtonDisabled: {
    opacity: 0.5,
  },
  tradeButtonPressed: {
    opacity: 0.8,
  },
  tradeButtonText: {
    ...theme.typography.caption,
    color: theme.color.textPrimary,
    fontWeight: '800',
  },
});
