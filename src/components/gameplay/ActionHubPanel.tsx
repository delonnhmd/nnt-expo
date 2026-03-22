import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import CollapsibleSection from '@/components/gameplay/CollapsibleSection';
import ProgressMeter from '@/components/ui/ProgressMeter';
import SurfaceCard from '@/components/ui/SurfaceCard';
import { theme } from '@/design/theme';
import { ActionExecutionGuard } from '@/hooks/useDailySession';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { DailyActionHubResponse, DailyActionItem } from '@/types/gameplay';

import ActionCard from './ActionCard';

function ActionSection({
  title,
  actions,
  onPreview,
  getExecutionGuard,
  collapsible = false,
  defaultExpanded = true,
}: {
  title: string;
  actions: DailyActionItem[];
  onPreview: (action: DailyActionItem) => void;
  getExecutionGuard: (action: DailyActionItem) => ActionExecutionGuard;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}) {
  const { isMobile } = useBreakpoint();
  const [expanded, setExpanded] = useState(!collapsible || defaultExpanded);

  useEffect(() => {
    if (!collapsible || !isMobile) {
      setExpanded(true);
      return;
    }
    setExpanded(defaultExpanded);
  }, [collapsible, defaultExpanded, isMobile]);

  const body = (
    <>
      {actions.length > 0 ? (
        actions.map((action, index) => {
          const executionGuard = getExecutionGuard(action);
          return (
            <ActionCard
              key={`${title}_${action.action_key}_${index}`}
              action={action}
              onPreview={onPreview}
              executionGuard={executionGuard}
            />
          );
        })
      ) : (
        <Text style={styles.empty}>No actions available right now.</Text>
      )}
    </>
  );

  if (!collapsible || !isMobile) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {body}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Pressable onPress={() => setExpanded((prev) => !prev)} style={styles.sectionHeaderButton}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionToggle}>{expanded ? 'Hide' : 'Show'}</Text>
      </Pressable>
      <CollapsibleSection expanded={expanded}>{body}</CollapsibleSection>
    </View>
  );
}

export default function ActionHubPanel({
  hub,
  onPreviewAction,
  getExecutionGuard,
  remainingTimeUnits,
  totalTimeUnits,
  sessionStatus,
  progressRatio,
}: {
  hub: DailyActionHubResponse;
  onPreviewAction: (action: DailyActionItem) => void;
  getExecutionGuard: (action: DailyActionItem) => ActionExecutionGuard;
  remainingTimeUnits: number;
  totalTimeUnits: number;
  sessionStatus: 'active' | 'ended';
  progressRatio: number;
}) {
  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.heading}>Action Hub</Text>
      <Text style={styles.subheading}>Pick your next move, review the tradeoffs, and then commit.</Text>
      <SurfaceCard variant="muted" style={styles.timeBox}>
        <View style={styles.timeTopRow}>
          <Text style={styles.timeTitle}>Day Progress</Text>
          <Text style={styles.timeMeta}>
            {remainingTimeUnits}/{totalTimeUnits} units left • {sessionStatus === 'active' ? 'Active' : 'Ended'}
          </Text>
        </View>
        <ProgressMeter progress={progressRatio} />
      </SurfaceCard>

      {hub.top_tradeoffs.length > 0 ? (
        <SurfaceCard variant="highlighted" style={styles.infoBox}>
          <Text style={styles.infoTitle}>Top Tradeoffs</Text>
          {hub.top_tradeoffs.slice(0, 3).map((item, index) => (
            <Text key={`tradeoff_${index}`} style={styles.infoText}>
              - {item}
            </Text>
          ))}
        </SurfaceCard>
      ) : null}

      {hub.next_risk_warnings.length > 0 ? (
        <SurfaceCard variant="warning" style={styles.warningBox}>
          <Text style={styles.warningTitle}>Immediate Risks</Text>
          {hub.next_risk_warnings.slice(0, 3).map((item, index) => (
            <Text key={`warning_${index}`} style={styles.warningText}>
              - {item}
            </Text>
          ))}
        </SurfaceCard>
      ) : null}

      <ActionSection
        title="Recommended"
        actions={hub.recommended_actions}
        onPreview={onPreviewAction}
        getExecutionGuard={getExecutionGuard}
      />
      <ActionSection
        title="Available"
        actions={hub.available_actions}
        onPreview={onPreviewAction}
        getExecutionGuard={getExecutionGuard}
        collapsible
        defaultExpanded={false}
      />
      <ActionSection
        title="Blocked"
        actions={hub.blocked_actions}
        onPreview={onPreviewAction}
        getExecutionGuard={getExecutionGuard}
        collapsible
        defaultExpanded={false}
      />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  heading: {
    color: theme.color.textPrimary,
    ...theme.typography.headingMd,
  },
  subheading: {
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
  },
  timeBox: {
    gap: theme.spacing.sm,
  },
  timeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  timeTitle: {
    color: theme.color.textSecondary,
    ...theme.typography.label,
  },
  timeMeta: {
    color: theme.color.textSecondary,
    ...theme.typography.caption,
  },
  infoBox: {
    gap: theme.spacing.xxs,
  },
  infoTitle: {
    color: theme.color.info,
    ...theme.typography.label,
  },
  infoText: {
    color: '#1e3a8a',
    ...theme.typography.bodySm,
  },
  warningBox: {
    gap: theme.spacing.xxs,
  },
  warningTitle: {
    color: '#92400e',
    ...theme.typography.label,
  },
  warningText: {
    color: '#78350f',
    ...theme.typography.bodySm,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionHeaderButton: {
    minHeight: 44,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.color.textSecondary,
    ...theme.typography.headingSm,
  },
  sectionToggle: {
    color: theme.color.info,
    ...theme.typography.label,
  },
  empty: {
    color: theme.color.muted,
    ...theme.typography.bodySm,
  },
});
