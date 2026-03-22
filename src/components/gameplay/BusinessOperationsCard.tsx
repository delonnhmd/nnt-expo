// Gold Penny — BusinessOperationsCard
// Primary-section interactive card for Fruit Shop / Food Truck daily operation.
// Shows real-time economy signals (margins, cost pressure, demand) from the backend
// world-state alongside the player's inventory and today's operate action.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/components/ui/PrimaryButton';
import { costPressureTone, marginTone } from '@/lib/economyPresentationFormatters';
import { BusinessMarginItem } from '@/types/economyPresentation';
import { BusinessPlanItem } from '@/types/strategicPlanning';
import { BusinessProfitSnapshot, PlayerBusinessRecord } from '@/types/business';

function businessLabel(type: string): string {
  if (type === 'fruit_shop') return 'Fruit Shop';
  if (type === 'food_truck') return 'Food Truck';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function operationReadiness(outlook: string | null | undefined): string {
  if (outlook === 'favorable') return 'Worth running today';
  if (outlook === 'mixed') return 'Playable, but margins are thin';
  if (outlook === 'pressured') return 'High-risk operating day';
  return 'Check the latest demand and cost signals';
}

interface BusinessOperationsCardProps {
  activeRecord: PlayerBusinessRecord;
  profitSnapshot: BusinessProfitSnapshot | null;
  margins: BusinessMarginItem | null;
  plan: BusinessPlanItem | null;
  operatedToday: boolean;
  sessionActive: boolean;
  isExecuting: boolean;
  onOperate: () => void;
}

export default function BusinessOperationsCard({
  activeRecord,
  profitSnapshot,
  margins,
  plan,
  operatedToday,
  sessionActive,
  isExecuting,
  onOperate,
}: BusinessOperationsCardProps) {
  const operateDisabled = operatedToday || !sessionActive || isExecuting;
  const operateLabel = operatedToday ? 'Operated Today \u2713' : 'Run Business Today';
  const latestProfit = profitSnapshot?.latest_daily_profit_xgp;
  const trailingProfit = profitSnapshot?.trailing_7d_profit_xgp;
  const inventoryUnits = activeRecord.inventory_produce_units + activeRecord.inventory_essentials_units + activeRecord.inventory_protein_units;
  const readinessCopy = operationReadiness(margins?.margin_outlook);
  const whyItMatters = margins?.short_explainer || 'Running the business turns stocked inventory into same-day cash, but weak margins can erase the upside.';
  const recommendation = plan?.recommendation_over_horizon || (margins?.margin_outlook === 'pressured'
    ? 'Recommended action: protect cash and inventory unless you urgently need operating income.'
    : 'Recommended action: operate only if the expected cash gain is worth today\'s time and cost pressure.');
  const watchItem = plan?.key_watch_item || (inventoryUnits <= 2
    ? 'Inventory is low, so one weak run can leave you with little room to recover.'
    : 'Watch demand and input costs before committing more inventory.');
  const inventoryStatus = inventoryUnits <= 0
    ? 'No inventory loaded. Restock before trying to rely on this business for cash.'
    : inventoryUnits <= 2
      ? 'Inventory is running low, so today\'s operating window is fragile.'
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{businessLabel(activeRecord.business_type)}</Text>
        {activeRecord.operating_mode ? (
          <Text style={styles.modeBadge}>{activeRecord.operating_mode.replace(/_/g, ' ')}</Text>
        ) : null}
      </View>

      {margins ? (
        <View style={styles.signalsRow}>
          <Text style={[styles.marginBadge, { color: marginTone(margins.margin_outlook) }]}>
            {String(margins.margin_outlook).replace(/_/g, ' ').toUpperCase()}
          </Text>
          <Text style={styles.signalItem}>Demand: {margins.demand_outlook}</Text>
          <Text style={[styles.signalItem, { color: costPressureTone(margins.cost_pressure) }]}>
            Cost: {margins.cost_pressure}
          </Text>
        </View>
      ) : null}

      <View style={styles.guidanceBox}>
        <Text style={styles.guidanceTitle}>{readinessCopy}</Text>
        <Text style={styles.explainer}>{whyItMatters}</Text>
      </View>

      <Text style={styles.recommendation}>{recommendation}</Text>
      <Text style={styles.watchText}>Watch item: {watchItem}</Text>

      {margins && (margins.risk_factors.length > 0 || margins.opportunity_factors.length > 0) ? (
        <View style={styles.bullets}>
          {margins.risk_factors[0] ? (
            <Text style={styles.riskText}>Risk: {margins.risk_factors[0]}</Text>
          ) : null}
          {margins.opportunity_factors[0] ? (
            <Text style={styles.oppText}>Upside: {margins.opportunity_factors[0]}</Text>
          ) : null}
        </View>
      ) : null}

      {inventoryStatus ? <Text style={styles.inventoryWarning}>{inventoryStatus}</Text> : null}

      {activeRecord.inventory_produce_units > 0
        || activeRecord.inventory_essentials_units > 0
        || activeRecord.inventory_protein_units > 0 ? (
        <View style={styles.inventoryRow}>
          {activeRecord.inventory_produce_units > 0 ? (
            <Text style={styles.inventoryItem}>Produce: {activeRecord.inventory_produce_units}u</Text>
          ) : null}
          {activeRecord.inventory_essentials_units > 0 ? (
            <Text style={styles.inventoryItem}>Essentials: {activeRecord.inventory_essentials_units}u</Text>
          ) : null}
          {activeRecord.inventory_protein_units > 0 ? (
            <Text style={styles.inventoryItem}>Protein: {activeRecord.inventory_protein_units}u</Text>
          ) : null}
        </View>
      ) : null}

      {latestProfit != null ? (
        <Text style={styles.profitLine}>
          {'Last profit: '}
          <Text style={{ color: latestProfit >= 0 ? '#166534' : '#b91c1c' }}>
            {latestProfit >= 0 ? '+' : ''}{latestProfit.toFixed(1)} XGP
          </Text>
          {trailingProfit != null ? (
            <Text style={styles.trailingProfit}>
              {'  7d avg: '}{trailingProfit >= 0 ? '+' : ''}{trailingProfit.toFixed(1)} XGP
            </Text>
          ) : null}
        </Text>
      ) : null}

      {!sessionActive ? (
        <Text style={styles.blockerText}>Day ended — start the next day to operate.</Text>
      ) : null}

      <PrimaryButton
        label={isExecuting && !operatedToday ? 'Running...' : operateLabel}
        onPress={operateDisabled ? undefined : onOperate}
        disabled={operateDisabled}
        loading={isExecuting && !operatedToday}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  modeBadge: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  signalsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  marginBadge: {
    fontSize: 11,
    fontWeight: '900',
  },
  signalItem: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  explainer: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
  guidanceBox: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 10,
    backgroundColor: '#f8fbff',
    padding: 10,
    gap: 4,
  },
  guidanceTitle: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '800',
  },
  recommendation: {
    color: '#1e40af',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  watchText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
  bullets: {
    gap: 3,
  },
  riskText: {
    color: '#b91c1c',
    fontSize: 12,
    lineHeight: 17,
  },
  oppText: {
    color: '#166534',
    fontSize: 12,
    lineHeight: 17,
  },
  inventoryRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  inventoryItem: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  inventoryWarning: {
    color: '#b45309',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  profitLine: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  trailingProfit: {
    color: '#64748b',
    fontSize: 12,
  },
  blockerText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
  },
});
