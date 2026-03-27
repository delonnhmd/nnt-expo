import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ActionHubPanel from '@/components/gameplay/ActionHubPanel';
import ActionPreviewModal from '@/components/gameplay/ActionPreviewModal';
import { OnboardingHighlight } from '@/components/onboarding';
import EmptyStateView from '@/components/ui/EmptyStateView';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { theme } from '@/design/theme';
import { useOnboarding } from '@/features/onboarding';
import { useScreenTimer } from '@/hooks/useScreenTimer';
import { formatMoney } from '@/lib/gameplayFormatters';
import { recordInfo } from '@/lib/logger';
import { DailyActionItem } from '@/types/gameplay';

import { useGameplayLoop } from '../context';
import {
  GameplayCompactMetricRows,
  GameplayStickyActionArea,
  GameplaySummaryCard,
  GameplayStatCard,
  GameplayWarningBanner,
} from '../components/GameplayUIParts';
import GameplayLoopScaffold from '../GameplayLoopScaffold';

function signedCurrency(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMoney(value)}`;
}

interface StarterJobOption {
  job_key: string;
  title: string;
  monthly_pay_xgp: number;
  stability_weight: number;
  performance_weight: number;
  stress_sensitivity: number;
}

const INTERACTION_DIAGNOSTICS_ENABLED =
  __DEV__
  || process.env.EXPO_PUBLIC_INTERACTION_DIAGNOSTICS === 'true'
  || process.env.EXPO_PUBLIC_INTERACTION_DIAGNOSTICS === '1';

function asStarterJobOptions(raw: unknown): StarterJobOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const row = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
      const job_key = String(row.job_key || '').trim();
      if (!job_key) return null;
      return {
        job_key,
        title: String(row.title || job_key),
        monthly_pay_xgp: Number(row.monthly_pay_xgp || 0) || 0,
        stability_weight: Number(row.stability_weight || 0) || 0,
        performance_weight: Number(row.performance_weight || 0) || 0,
        stress_sensitivity: Number(row.stress_sensitivity || 0) || 0,
      };
    })
    .filter((entry): entry is StarterJobOption => Boolean(entry));
}

const LOAN_AMOUNTS = [100, 200, 300, 500] as const;

export default function DashboardScreen() {
  useScreenTimer('dashboard');
  const loop = useGameplayLoop();
  const onboarding = useOnboarding();
  const guidedDashboardActive = onboarding.isActive && onboarding.currentStep?.route === 'dashboard';

  // ── Stats ──
  const stats = loop.dashboard?.stats;
  const netCashFlow = loop.economyState.netCashFlow ?? 0;
  const pressureLabel = loop.expenseDebt.debtPressure.charAt(0).toUpperCase()
    + loop.expenseDebt.debtPressure.slice(1);
  const cash = stats?.cash_xgp ?? 0;
  const stress = stats?.stress ?? 0;
  const health = stats?.health ?? 100;
  const debt = loop.expenseDebt?.debtAmount ?? stats?.debt_xgp ?? 0;

  // ── Work / Job selection ──
  const switchJobAction = useMemo(() => {
    if (!loop.actionHub) return null;
    return (
      [...(loop.actionHub.recommended_actions || []), ...(loop.actionHub.available_actions || [])]
        .find((action) => String(action.action_key || '').toLowerCase() === 'switch_job')
      || null
    );
  }, [loop.actionHub]);
  const starterJobOptions = useMemo(
    () => asStarterJobOptions(switchJobAction?.parameters?.job_options),
    [switchJobAction?.parameters?.job_options],
  );
  const currentJobKey = String(
    loop.actionHub?.debug_meta?.current_job_key
    || loop.dashboard?.stats?.current_job
    || '',
  ).trim();
  const hasStarterJobSelected = Boolean(
    loop.actionHub?.debug_meta?.has_starter_job_selected
    ?? currentJobKey,
  );
  const firstSessionFlag = Boolean(
    loop.dashboard?.debug_meta?.new_player_first_session
    ?? loop.actionHub?.debug_meta?.new_player_first_session
    ?? false,
  );
  const showStarterJobChooser = starterJobOptions.length > 0 && (firstSessionFlag || !hasStarterJobSelected);
  const selectingStarterJob = loop.executingAction && loop.busyActionKey === 'switch_job';
  const endDayDisabled = !loop.dailyProgression.canAdvanceDay || loop.endingDay;

  useEffect(() => {
    if (!INTERACTION_DIAGNOSTICS_ENABLED) return;
    recordInfo('gameplayLoop', 'Dashboard job selection visibility evaluated.', {
      action: 'job_selection_visibility',
      context: {
        playerId: loop.playerId,
        firstSessionFlag,
        showStarterJobChooser,
        starterJobOptionsCount: starterJobOptions.length,
        hasStarterJobSelected,
        currentJobKey: currentJobKey || null,
      },
    });
  }, [
    currentJobKey,
    firstSessionFlag,
    hasStarterJobSelected,
    loop.playerId,
    showStarterJobChooser,
    starterJobOptions.length,
  ]);

  const selectStarterJob = (job: StarterJobOption) => {
    const template: DailyActionItem = switchJobAction || {
      action_key: 'switch_job',
      title: 'Choose Your First Job',
      description: 'Select one starter role to unlock work-shift income.',
      status: 'available',
      blockers: [],
      warnings: [],
      tradeoffs: [],
      confidence_level: 'unknown',
      parameters: {},
    };
    const action: DailyActionItem = {
      ...template,
      title: hasStarterJobSelected ? `Switch To ${job.title}` : `Choose ${job.title}`,
      status: 'available',
      parameters: {
        ...(template.parameters || {}),
        new_job_key: job.job_key,
        job_key: job.job_key,
      },
    };
    void loop.executeAction(action);
  };

  // ── Life / Meals ──
  const [busyMeal, setBusyMeal] = useState<string | null>(null);
  const busyLife = loop.executingAction || busyMeal !== null;

  async function handleEat(mealType: 'breakfast' | 'lunch' | 'dinner') {
    if (busyLife) return;
    setBusyMeal(`eat_${mealType}`);
    await loop.eatMeal(mealType);
    setBusyMeal(null);
  }

  // ── Finance / Loans ──
  const [loanAmount, setLoanAmount] = useState<100 | 200 | 300 | 500>(100);
  const [busyLoan, setBusyLoan] = useState(false);
  const busyFinance = loop.executingAction || busyLoan;
  const loanRepay = Math.round(loanAmount * 1.15);

  async function handleLoan() {
    if (busyFinance) return;
    setBusyLoan(true);
    await loop.takeLoan(loanAmount);
    setBusyLoan(false);
  }

  return (
    <GameplayLoopScaffold
      title="Dashboard"
      subtitle="Actions, status, and what to do now"
      activeNavKey="dashboard"
      footer={guidedDashboardActive ? null : (
        <GameplayStickyActionArea
          summary={`${loop.dailySession.remainingTimeUnits} time units left today`}
          secondaryLabel="Check Market"
          onSecondaryPress={() => onboarding.navigateTo('market')}
          primaryLabel={loop.endingDay ? 'Settling Day...' : 'End Day'}
          onPrimaryPress={() => void loop.endCurrentDay()}
          primaryLoading={loop.endingDay}
          primaryDisabled={endDayDisabled}
        />
      )}
    >
      {/* ── Stats ── */}
      {stats ? (
        <OnboardingHighlight target="dashboard-core-stats">
          <GameplaySummaryCard eyebrow="Status" title="Money, Health &amp; Stress">
            <GameplayCompactMetricRows
              items={[
                {
                  label: 'Cash',
                  value: formatMoney(cash),
                  tone: cash < 50 ? 'danger' : cash < 200 ? 'warning' : 'positive',
                },
                {
                  label: 'Net flow today',
                  value: signedCurrency(netCashFlow),
                  tone: netCashFlow >= 0 ? 'positive' : 'danger',
                },
                {
                  label: 'Debt',
                  value: formatMoney(stats.debt_xgp),
                  tone: stats.debt_xgp > cash ? 'danger' : 'neutral',
                },
                {
                  label: 'Health',
                  value: `${Math.round(health)} / 100`,
                  tone: health < 40 ? 'danger' : health < 65 ? 'warning' : 'positive',
                },
                {
                  label: 'Stress',
                  value: String(Math.round(stress)),
                  tone: stress >= 75 ? 'danger' : stress >= 55 ? 'warning' : 'neutral',
                },
                {
                  label: 'Debt pressure',
                  value: pressureLabel,
                  tone: loop.expenseDebt.debtWarning ? 'danger' : 'neutral',
                },
              ]}
            />
          </GameplaySummaryCard>
        </OnboardingHighlight>
      ) : (
        <GameplayWarningBanner
          title="No stats loaded"
          message="Pull to refresh."
          tone="info"
        />
      )}

      {/* ── Work ── */}
      <GameplaySummaryCard eyebrow="Work" title="Income &amp; Shifts">
        <View style={styles.metricRow}>
          <GameplayStatCard
            label="Today's pay"
            value={loop.jobIncome.dailyIncomeLabel}
            tone={loop.jobIncome.incomeAmount != null && loop.jobIncome.incomeAmount >= 0 ? 'positive' : 'warning'}
            note={loop.jobIncome.currentJob ? loop.jobIncome.currentJob.replace(/_/g, ' ') : 'No job selected'}
          />
          <GameplayStatCard
            label="Time left"
            value={`${loop.dailySession.remainingTimeUnits}/${loop.dailySession.totalTimeUnits}`}
            tone={loop.dailySession.remainingTimeUnits <= 2 ? 'warning' : 'info'}
            note="Each shift uses time units."
          />
        </View>
      </GameplaySummaryCard>

      {showStarterJobChooser ? (
        <GameplaySummaryCard
          eyebrow={hasStarterJobSelected ? 'Switch Job' : 'Day 1 — Choose Your Job'}
          title={hasStarterJobSelected ? `Current: ${currentJobKey.replace(/_/g, ' ')}` : 'Pick a Role to Start Earning'}
        >
          <View style={styles.jobOptionsGrid}>
            {starterJobOptions.map((job) => {
              const isCurrent = currentJobKey === job.job_key;
              return (
                <View key={job.job_key} style={[styles.jobOptionCard, isCurrent ? styles.jobOptionCardActive : null]}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobPay}>~{Math.round(job.monthly_pay_xgp)} xgp/mo</Text>
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      styles.jobSelectButton,
                      isCurrent ? styles.jobSelectButtonCurrent : null,
                      selectingStarterJob ? styles.jobSelectButtonDisabled : null,
                    ]}
                    disabled={selectingStarterJob || isCurrent}
                    onPress={() => selectStarterJob(job)}
                  >
                    <Text style={[styles.jobSelectButtonLabel, isCurrent ? styles.jobSelectButtonLabelCurrent : null]}>
                      {isCurrent ? 'Current Job' : selectingStarterJob ? 'Applying...' : 'Select'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </GameplaySummaryCard>
      ) : null}

      {loop.actionHub ? (
        <OnboardingHighlight target="work-first-action">
          <ActionHubPanel
            hub={loop.actionHub}
            onPreviewAction={(action) => void loop.openActionPreview(action)}
            getExecutionGuard={(action) => loop.dailySession.canExecuteAction(action)}
            remainingTimeUnits={loop.dailySession.remainingTimeUnits}
            totalTimeUnits={loop.dailySession.totalTimeUnits}
            sessionStatus={loop.dailySession.sessionStatus}
            progressRatio={loop.dailySession.progress}
          />
        </OnboardingHighlight>
      ) : (
        <EmptyStateView
          title="No actions loaded"
          subtitle="Refresh to pull the latest actions."
        />
      )}

      {/* ── Life ── */}
      <GameplaySummaryCard eyebrow="Life" title="Food &amp; Recovery">
        {cash < 6 ? (
          <GameplayWarningBanner
            title="Not enough cash for a meal"
            message="You need at least 6 XGP. Run a shift first."
            tone="danger"
          />
        ) : null}
        <View style={styles.buttonRow}>
          <View style={styles.mealBtn}>
            <PrimaryButton
              label={busyMeal === 'eat_breakfast' ? 'Eating...' : 'Breakfast (−6 XGP)'}
              onPress={() => void handleEat('breakfast')}
              disabled={busyLife || cash < 6}
            />
          </View>
          <View style={styles.mealBtn}>
            <SecondaryButton
              label={busyMeal === 'eat_lunch' ? 'Eating...' : 'Lunch (−6 XGP)'}
              onPress={() => void handleEat('lunch')}
              disabled={busyLife || cash < 6}
            />
          </View>
          <View style={styles.mealBtn}>
            <SecondaryButton
              label={busyMeal === 'eat_dinner' ? 'Eating...' : 'Dinner (−6 XGP)'}
              onPress={() => void handleEat('dinner')}
              disabled={busyLife || cash < 6}
            />
          </View>
        </View>
      </GameplaySummaryCard>

      {/* ── Finance ── */}
      <GameplaySummaryCard eyebrow="Finance" title="Quick Loan">
        {debt > 200 ? (
          <GameplayWarningBanner
            title="High debt"
            message={`Current debt: ${formatMoney(debt)}. Borrowing adds more — try earning first.`}
            tone="warning"
          />
        ) : null}
        <View style={styles.loanAmountRow}>
          {LOAN_AMOUNTS.map((amt) => {
            const active = loanAmount === amt;
            return (
              <View key={amt} style={styles.loanAmtBtn}>
                {active ? (
                  <PrimaryButton label={`${amt} XGP`} onPress={() => setLoanAmount(amt)} disabled={busyFinance} />
                ) : (
                  <SecondaryButton label={`${amt} XGP`} onPress={() => setLoanAmount(amt)} disabled={busyFinance} />
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.loanRepayNote}>
          Borrow {loanAmount} XGP → owe {loanRepay} XGP (+15%).
        </Text>
        <View style={styles.loanConfirmBtn}>
          <PrimaryButton
            label={busyLoan ? 'Borrowing...' : `Borrow ${loanAmount} XGP`}
            onPress={() => void handleLoan()}
            disabled={busyFinance}
          />
        </View>
      </GameplaySummaryCard>

      {/* ── Warnings ── */}
      {cash < 50 ? (
        <GameplayWarningBanner
          title="Almost out of money"
          message="Run a work shift to earn XGP, or borrow a quick loan above."
          tone="danger"
        />
      ) : null}

      {stress >= 70 ? (
        <GameplayWarningBanner
          title="Stress is very high"
          message="Eat a meal above to reduce stress before it affects your health."
          tone="warning"
        />
      ) : null}

      <ActionPreviewModal
        visible={Boolean(loop.selectedPreviewAction)}
        action={loop.selectedPreviewAction}
        preview={loop.actionPreview}
        loading={loop.previewLoading}
        error={loop.previewError}
        onClose={loop.closeActionPreview}
        onExecuteAction={() => void loop.executeSelectedAction()}
        executeDisabled={loop.dailySession.sessionStatus !== 'active'}
        executeGuard={loop.selectedPreviewAction ? loop.dailySession.canExecuteAction(loop.selectedPreviewAction) : undefined}
        executing={loop.executingAction}
      />
    </GameplayLoopScaffold>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  buttonRow: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  mealBtn: {
    flex: 1,
  },
  loanAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  loanAmtBtn: {
    flex: 1,
    minWidth: 70,
  },
  loanRepayNote: {
    ...theme.typography.bodySm,
    color: theme.color.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  loanConfirmBtn: {
    marginTop: theme.spacing.xs,
  },
  jobOptionsGrid: {
    gap: theme.spacing.sm,
  },
  jobOptionCard: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceAlt,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobOptionCardActive: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  jobTitle: {
    color: theme.color.textPrimary,
    ...theme.typography.bodyMd,
    fontWeight: '800',
    flex: 1,
  },
  jobPay: {
    color: theme.color.info,
    ...theme.typography.bodySm,
    fontWeight: '700',
    marginRight: theme.spacing.sm,
  },
  jobSelectButton: {
    minHeight: 36,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  jobSelectButtonCurrent: {
    borderColor: '#16a34a',
    backgroundColor: '#dcfce7',
  },
  jobSelectButtonDisabled: {
    opacity: 0.7,
  },
  jobSelectButtonLabel: {
    color: '#ffffff',
    ...theme.typography.bodySm,
    fontWeight: '700',
  },
  jobSelectButtonLabelCurrent: {
    color: '#166534',
  },
});
