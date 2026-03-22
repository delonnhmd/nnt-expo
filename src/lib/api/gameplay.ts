import { fetchApiWithFallback } from '@/lib/apiClient';
import {
  ActionImpact,
  ActionExecutionResponse,
  ActionPreviewRequest,
  ActionPreviewResponse,
  ActionRecommendationState,
  ConfidenceLevel,
  DailyActionHubResponse,
  DailyActionItem,
  EndDayResponse,
  EndOfDaySummaryResponse,
  GameplayActionKey,
  PlayerDashboardResponse,
  PlayerNotificationItem,
  PlayerNotificationResponse,
  TrendDirection,
  WeeklyPlayerSummaryResponse,
} from '@/types/gameplay';


function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

function toTrendDirection(value: unknown, fallback: TrendDirection = 'flat'): TrendDirection {
  const normalized = toString(value).toLowerCase();
  if (normalized === 'up' || normalized === 'increase' || normalized === 'gain') return 'up';
  if (normalized === 'down' || normalized === 'decrease' || normalized === 'loss') return 'down';
  if (normalized === 'mixed') return 'mixed';
  if (normalized === 'flat' || normalized === 'neutral' || normalized === 'stable') return 'flat';
  return fallback;
}

function toConfidence(value: unknown): ConfidenceLevel {
  const normalized = toString(value, 'unknown').toLowerCase();
  if (normalized === 'high') return 'high';
  if (normalized === 'medium' || normalized === 'moderate') return 'medium';
  if (normalized === 'low') return 'low';
  return 'unknown';
}

function normalizeActionStatus(value: unknown): ActionRecommendationState {
  const normalized = toString(value, 'available').toLowerCase();
  if (normalized === 'recommended') return 'recommended';
  if (normalized === 'blocked') return 'blocked';
  return 'available';
}

function normalizeAction(raw: unknown, fallbackStatus: ActionRecommendationState, index: number): DailyActionItem {
  if (typeof raw === 'string') {
    return {
      action_key: raw as GameplayActionKey,
      title: raw.replace(/_/g, ' '),
      description: 'Suggested action from daily brief',
      status: fallbackStatus,
      blockers: [],
      warnings: [],
      tradeoffs: [],
      confidence_level: 'unknown',
      parameters: {},
      debug_meta: {},
    };
  }
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const blockers = Array.isArray(obj.blockers)
    ? obj.blockers.map((entry) => toString(entry)).filter(Boolean)
    : obj.blocker_text
      ? [toString(obj.blocker_text)]
      : [];

  return {
    action_key: toString(obj.action_key || obj.key || obj.id || `action_${index}`) as GameplayActionKey,
    title: toString(obj.title || obj.name || obj.action_key || 'Action'),
    description: toString(obj.description || obj.reason || 'No description provided.'),
    status: normalizeActionStatus(obj.status || fallbackStatus),
    blockers,
    blocker_text: blockers.length > 0 ? blockers[0] : null,
    tradeoffs: Array.isArray(obj.tradeoffs) ? obj.tradeoffs.map((entry) => toString(entry)) : [],
    warnings: Array.isArray(obj.warnings) ? obj.warnings.map((entry) => toString(entry)) : [],
    confidence_level: toConfidence(obj.confidence_level),
    parameters: (obj.parameters as Record<string, unknown>) || {},
    debug_meta: (obj.debug_meta as Record<string, unknown>) || {},
  };
}

function normalizeImpact(raw: unknown, label: string, fallbackDirection: TrendDirection): ActionImpact {
  if (raw == null) {
    return { label, direction: fallbackDirection, text: 'No estimate' };
  }
  if (typeof raw === 'number') {
    return {
      label,
      direction: raw > 0 ? 'up' : raw < 0 ? 'down' : 'flat',
      amount: raw,
      text: `${raw > 0 ? '+' : ''}${raw}`,
    };
  }
  if (typeof raw === 'string') {
    return {
      label,
      direction: fallbackDirection,
      text: raw,
    };
  }

  const obj = raw as Record<string, unknown>;
  const amount = obj.amount != null ? toNumber(obj.amount) : undefined;
  return {
    label: toString(obj.label, label),
    direction: toTrendDirection(obj.direction, fallbackDirection),
    amount,
    text: toString(obj.text, amount != null ? `${amount > 0 ? '+' : ''}${amount}` : ''),
  };
}

function normalizeDashboard(raw: Record<string, unknown>, playerId: string): PlayerDashboardResponse {
  const stats = (raw.stats as Record<string, unknown>) || {};
  const opportunitiesRaw =
    (Array.isArray(raw.top_opportunities) ? raw.top_opportunities : null) ||
    (Array.isArray(raw.opportunities) ? raw.opportunities : null) ||
    [];
  const risksRaw =
    (Array.isArray(raw.top_risks) ? raw.top_risks : null) ||
    (Array.isArray(raw.risks) ? raw.risks : null) ||
    [];
  const hints = Array.isArray(raw.recommended_actions)
    ? raw.recommended_actions
    : Array.isArray(raw.action_hints_json)
      ? raw.action_hints_json
      : [];

  return {
    player_id: toString(raw.player_id, playerId),
    as_of_date: toString(raw.as_of_date || raw.date || raw.settled_day, ''),
    headline: toString(raw.headline || raw.summary_headline, 'Today at Gold Penny'),
    daily_brief: toString(raw.daily_brief || raw.summary, 'No daily brief available yet.'),
    stats: {
      cash_xgp: toNumber(stats.cash_xgp ?? raw.ending_cash_xgp ?? raw.cash),
      debt_xgp: toNumber(stats.debt_xgp ?? raw.ending_debt_xgp ?? raw.debt_xgp),
      net_worth_xgp: toNumber(stats.net_worth_xgp ?? raw.net_worth_xgp),
      stress: toNumber(stats.stress ?? raw.stress ?? raw.stress_after),
      health: toNumber(stats.health ?? raw.health ?? raw.health_after, 100),
      credit_score: toNumber(stats.credit_score ?? raw.ending_credit_score ?? raw.credit_score, 650),
      current_job: toString(stats.current_job ?? raw.main_job ?? raw.current_job, ''),
      region_key: toString(stats.region_key ?? raw.region_key ?? raw.housing_region, ''),
    },
    state_cards: Array.isArray(raw.state_cards) ? (raw.state_cards as any) : [],
    top_opportunities: opportunitiesRaw.map((entry, index) => {
      const item = (entry || {}) as Record<string, unknown>;
      return {
        key: toString(item.key, `opportunity_${index}`),
        title: toString(item.title || item.name, 'Opportunity'),
        description: toString(item.description || item.summary, ''),
        severity: toString(item.severity || 'low') as any,
        value: item.value != null ? toNumber(item.value) : undefined,
        category: toString(item.category, ''),
      };
    }),
    top_risks: risksRaw.map((entry, index) => {
      const item = (entry || {}) as Record<string, unknown>;
      return {
        key: toString(item.key, `risk_${index}`),
        title: toString(item.title || item.name, 'Risk'),
        description: toString(item.description || item.summary, ''),
        severity: toString(item.severity || 'medium') as any,
        value: item.value != null ? toNumber(item.value) : undefined,
        category: toString(item.category, ''),
      };
    }),
    recommended_actions: hints.map((entry, index) => {
      if (typeof entry === 'string') {
        return {
          action_key: entry as GameplayActionKey,
          title: entry.replace(/_/g, ' '),
          reason: 'Recommended in daily brief',
        };
      }
      const item = (entry || {}) as Record<string, unknown>;
      return {
        action_key: toString(item.action_key || item.key || `action_${index}`) as GameplayActionKey,
        title: toString(item.title || item.name || item.action_key || 'Action'),
        reason: toString(item.reason || item.description || 'Recommended action'),
      };
    }),
    debug_meta: (raw.debug_meta as Record<string, unknown>) || {},
  };
}

function normalizeActionHub(raw: Record<string, unknown>, playerId: string): DailyActionHubResponse {
  const recommendedRaw = Array.isArray(raw.recommended_actions) ? raw.recommended_actions : [];
  const availableRaw = Array.isArray(raw.available_actions) ? raw.available_actions : [];
  const blockedRaw = Array.isArray(raw.blocked_actions) ? raw.blocked_actions : [];

  return {
    player_id: toString(raw.player_id, playerId),
    as_of_date: toString(raw.as_of_date || raw.date || raw.settled_day, ''),
    recommended_actions: recommendedRaw.map((entry, index) => normalizeAction(entry, 'recommended', index)),
    available_actions: availableRaw.map((entry, index) => normalizeAction(entry, 'available', index)),
    blocked_actions: blockedRaw.map((entry, index) => normalizeAction(entry, 'blocked', index)),
    top_tradeoffs: Array.isArray(raw.top_tradeoffs)
      ? raw.top_tradeoffs.map((entry) => toString(entry))
      : [],
    next_risk_warnings: Array.isArray(raw.next_risk_warnings)
      ? raw.next_risk_warnings.map((entry) => toString(entry))
      : [],
    debug_meta: (raw.debug_meta as Record<string, unknown>) || {},
  };
}

function normalizePreview(raw: Record<string, unknown>, playerId: string, actionKey: GameplayActionKey): ActionPreviewResponse {
  return {
    player_id: toString(raw.player_id, playerId),
    action_key: toString(raw.action_key, actionKey) as GameplayActionKey,
    summary: toString(raw.summary, 'Preview is available.'),
    expected_cash_impact: normalizeImpact(raw.expected_cash_impact, 'Cash', 'mixed'),
    expected_stress_impact: normalizeImpact(raw.expected_stress_impact, 'Stress', 'mixed'),
    expected_health_impact: normalizeImpact(raw.expected_health_impact, 'Health', 'mixed'),
    expected_time_impact: normalizeImpact(raw.expected_time_impact, 'Time', 'mixed'),
    expected_career_impact: normalizeImpact(raw.expected_career_impact, 'Career', 'mixed'),
    expected_distress_impact: normalizeImpact(raw.expected_distress_impact, 'Distress', 'mixed'),
    blockers: Array.isArray(raw.blockers) ? raw.blockers.map((entry) => toString(entry)) : [],
    warnings: Array.isArray(raw.warnings) ? raw.warnings.map((entry) => toString(entry)) : [],
    confidence_level: toConfidence(raw.confidence_level),
    debug_meta: (raw.debug_meta as Record<string, unknown>) || {},
  };
}

function normalizeEndOfDay(raw: Record<string, unknown>, playerId: string): EndOfDaySummaryResponse {
  const earned = toNumber(raw.total_earned_xgp ?? raw.income_xgp);
  const spent = toNumber(raw.total_spent_xgp ?? raw.expenses_xgp);
  const net = toNumber(raw.net_change_xgp, earned - spent);

  return {
    player_id: toString(raw.player_id, playerId),
    as_of_date: toString(raw.as_of_date || raw.settled_day || raw.day_number, ''),
    total_earned_xgp: earned,
    total_spent_xgp: spent,
    net_change_xgp: net,
    biggest_gain: toString(raw.biggest_gain, 'No standout gain today'),
    biggest_loss: toString(raw.biggest_loss, 'No standout loss today'),
    stress_delta: toNumber(raw.stress_delta ?? raw.stress_change),
    health_delta: toNumber(raw.health_delta ?? raw.health_change),
    skill_delta: toNumber(raw.skill_delta, 0),
    credit_score_delta: toNumber(raw.credit_score_delta ?? raw.credit_score_change),
    distress_state: toString(raw.distress_state ?? raw.distress_state_after, 'stable'),
    tomorrow_warnings: Array.isArray(raw.tomorrow_warnings)
      ? raw.tomorrow_warnings.map((entry) => toString(entry))
      : [],
    debug_meta: (raw.debug_meta as Record<string, unknown>) || {},
  };
}

function normalizeWeekly(raw: Record<string, unknown>, playerId: string): WeeklyPlayerSummaryResponse {
  const weeklyIncomeMix = Array.isArray(raw.weekly_income_mix)
    ? raw.weekly_income_mix.map((entry) => {
      const item = (entry || {}) as Record<string, unknown>;
      return {
        source: toString(item.source, 'income'),
        amount_xgp: toNumber(item.amount_xgp ?? item.amount),
      };
    })
    : [];

  return {
    player_id: toString(raw.player_id, playerId),
    week_start: toString(raw.week_start, ''),
    week_end: toString(raw.week_end, ''),
    weekly_income_mix: weeklyIncomeMix,
    top_pressure: toString(raw.top_pressure || raw.largest_cost_pressure, 'No major pressure flagged'),
    strongest_opportunity: toString(raw.strongest_opportunity || raw.dominant_income_source, 'No clear opportunity flagged'),
    strategy_classification: toString(raw.strategy_classification, 'stable_worker'),
    risk_trend: toString(raw.risk_trend || raw.distress_trend, 'stable'),
    growth_trend: toString(raw.growth_trend || raw.career_trend, 'steady'),
    suggested_next_moves: Array.isArray(raw.suggested_next_moves)
      ? raw.suggested_next_moves.map((entry) => toString(entry))
      : [],
    notable_event_chain: toString(raw.notable_event_chain, ''),
    debug_meta: (raw.debug_meta as Record<string, unknown>) || {},
  };
}

function normalizeNotifications(raw: Record<string, unknown>, playerId: string): PlayerNotificationResponse {
  const notificationsRaw = Array.isArray(raw.notifications)
    ? raw.notifications
    : Array.isArray(raw.items)
      ? raw.items
      : [];

  const notifications: PlayerNotificationItem[] = notificationsRaw.map((entry, index) => {
    const item = (entry || {}) as Record<string, unknown>;
    return {
      id: toString(item.id, `notification_${index}`),
      severity: (toString(item.severity, 'info') as any) || 'info',
      category: toString(item.category, 'general'),
      title: toString(item.title, 'Notification'),
      body: toString(item.body || item.message, ''),
      suggested_action: toString(item.suggested_action, ''),
      created_at: toString(item.created_at || item.timestamp, ''),
      read: Boolean(item.read),
    };
  });

  return {
    player_id: toString(raw.player_id, playerId),
    as_of_date: toString(raw.as_of_date || raw.date, ''),
    notifications,
    debug_meta: (raw.debug_meta as Record<string, unknown>) || {},
  };
}

function canonicalActionKey(actionKey: GameplayActionKey): GameplayActionKey {
  const raw = toString(actionKey).toLowerCase().trim();
  if (raw.includes('business') && raw.includes('operate')) return 'operate_business';
  if (raw.includes('inventory') || raw.includes('stock')) return 'buy_inventory';
  if (raw.includes('ride') || raw.includes('delivery') || raw.includes('side_income')) return 'side_income';
  if (raw.includes('work') || raw.includes('shift') || raw.includes('job')) return 'work_shift';
  if (raw.includes('study') || raw.includes('train') || raw.includes('cert')) return 'study';
  if (raw.includes('debt') || raw.includes('payment')) return 'debt_payment';
  if (raw.includes('recovery')) return 'recovery_action';
  if (raw.includes('housing') || raw.includes('region') || raw.includes('move')) return 'change_region';
  if (raw.includes('rest') || raw.includes('sleep')) return 'rest';
  return actionKey;
}

function executionResponseBase(
  playerId: string,
  actionKey: GameplayActionKey,
  message: string,
  resultSummary: string,
  timeCostUnits: number,
  rawResult: Record<string, unknown>,
): ActionExecutionResponse {
  return {
    player_id: playerId,
    action_key: actionKey,
    success: true,
    message,
    result_summary: resultSummary,
    time_cost_units: Math.max(1, Math.min(4, Math.round(timeCostUnits))),
    raw_result: rawResult,
  };
}

function normalizeEndDay(raw: Record<string, unknown>, playerId: string): EndDayResponse {
  return {
    player_id: toString(raw.player_id, playerId),
    settled_day: Math.max(0, Math.round(toNumber(raw.settled_day ?? raw.day_number ?? raw.day))),
    message: toString(raw.message, 'Day settled.'),
    summary_headline: toString(raw.summary_headline || raw.headline, ''),
    summary: toString(raw.summary, ''),
    ending_cash_xgp: toNumber(raw.ending_cash_xgp ?? raw.cash_after ?? raw.ending_cash),
    stress_change: toNumber(raw.stress_change),
    health_change: toNumber(raw.health_change),
    raw_result: raw,
  };
}

export async function getPlayerDashboard(playerId: string): Promise<PlayerDashboardResponse> {
  const raw = await fetchApiWithFallback<Record<string, unknown>>([
    `/gameplay/player/${playerId}/dashboard`,
    `/gameplay/${playerId}/dashboard`,
    `/player/${playerId}/dashboard`,
    `/dashboard/player/${playerId}`,
    `/briefs/player/${playerId}/latest`,
    `/day/summary/${playerId}`,
  ]);
  return normalizeDashboard(raw, playerId);
}

export async function getPlayerActions(playerId: string): Promise<DailyActionHubResponse> {
  try {
    const raw = await fetchApiWithFallback<Record<string, unknown>>([
      `/gameplay/player/${playerId}/actions`,
      `/gameplay/player/${playerId}/action-hub`,
      `/gameplay/${playerId}/actions`,
      `/player/${playerId}/actions`,
    ]);
    return normalizeActionHub(raw, playerId);
  } catch {
    const brief = await fetchApiWithFallback<Record<string, unknown>>([`/briefs/player/${playerId}/latest`]);
    const hints = Array.isArray(brief.action_hints_json) ? brief.action_hints_json : [];
    return {
      player_id: playerId,
      as_of_date: toString(brief.day, ''),
      recommended_actions: hints.map((entry, index) => normalizeAction(entry, 'recommended', index)),
      available_actions: [],
      blocked_actions: [],
      top_tradeoffs: [],
      next_risk_warnings: [],
      debug_meta: { source: 'brief_fallback' },
    };
  }
}

export async function previewPlayerAction(
  playerId: string,
  payload: ActionPreviewRequest,
): Promise<ActionPreviewResponse> {
  const raw = await fetchApiWithFallback<Record<string, unknown>>(
    [
      `/gameplay/player/${playerId}/actions/preview`,
      `/gameplay/player/${playerId}/action-preview`,
      `/player/${playerId}/actions/preview`,
    ],
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return normalizePreview(raw, playerId, payload.action_key);
}

export async function getEndOfDaySummary(playerId: string): Promise<EndOfDaySummaryResponse> {
  const raw = await fetchApiWithFallback<Record<string, unknown>>([
    `/gameplay/player/${playerId}/end-of-day-summary`,
    `/player/${playerId}/end-of-day-summary`,
    `/day/summary/${playerId}`,
  ]);
  return normalizeEndOfDay(raw, playerId);
}

export async function getWeeklySummary(playerId: string): Promise<WeeklyPlayerSummaryResponse> {
  const raw = await fetchApiWithFallback<Record<string, unknown>>([
    `/gameplay/player/${playerId}/weekly-summary`,
    `/player/${playerId}/weekly-summary`,
    `/strategy/player/${playerId}/weekly`,
  ]);
  return normalizeWeekly(raw, playerId);
}

export async function executeAction(
  playerId: string,
  actionKey: GameplayActionKey,
  params: Record<string, unknown> = {},
): Promise<ActionExecutionResponse> {
  const canonical = canonicalActionKey(actionKey);
  const unifiedPayload = {
    action_key: canonical,
    parameters: params,
  };

  try {
    const unified = await fetchApiWithFallback<Record<string, unknown>>(
      [
        `/gameplay/player/${playerId}/actions/execute`,
        `/gameplay/player/${playerId}/execute-action`,
        `/player/${playerId}/actions/execute`,
      ],
      {
        method: 'POST',
        body: JSON.stringify(unifiedPayload),
      },
    );

    return executionResponseBase(
      playerId,
      canonical,
      toString(unified.message, 'Action executed'),
      toString(unified.result_summary || unified.summary || unified.message, 'Action completed.'),
      toNumber(unified.time_cost_units ?? params.time_cost_units ?? 2, 2),
      unified,
    );
  } catch {
    // Fallback to known backend endpoints when unified execution is unavailable.
  }

  if (canonical === 'operate_business') {
    const raw = await fetchApiWithFallback<Record<string, unknown>>(
      [`/business/player/${playerId}/operate`],
      {
        method: 'POST',
        body: JSON.stringify({ as_of_date: params.as_of_date ?? null }),
      },
    );
    return executionResponseBase(
      playerId,
      canonical,
      'Business operation completed',
      toString(raw.summary || raw.message, 'Business operation finished.'),
      toNumber(params.time_cost_units, 2),
      raw,
    );
  }

  if (canonical === 'buy_inventory') {
    const businessId = toString(params.business_id || params.businessId);
    if (!businessId) {
      throw new Error('Inventory purchase needs business_id.');
    }
    const raw = await fetchApiWithFallback<Record<string, unknown>>(
      [`/business/player/${playerId}/inventory/purchase`],
      {
        method: 'POST',
        body: JSON.stringify({
          business_id: businessId,
          produce_units: toNumber(params.produce_units, 0),
          essentials_units: toNumber(params.essentials_units, 0),
          protein_units: toNumber(params.protein_units, 0),
          as_of_date: params.as_of_date ?? null,
        }),
      },
    );
    return executionResponseBase(
      playerId,
      canonical,
      'Inventory purchased',
      toString(raw.message || raw.summary, 'Inventory updated.'),
      toNumber(params.time_cost_units, 1),
      raw,
    );
  }

  if (canonical === 'study') {
    const raw = await fetchApiWithFallback<Record<string, unknown>>(
      [`/career/player/${playerId}/training/log`],
      {
        method: 'POST',
        body: JSON.stringify({
          training_hours: Math.max(0, Math.min(4, toNumber(params.training_hours, 2))),
          as_of_date: params.as_of_date ?? null,
        }),
      },
    );
    return executionResponseBase(
      playerId,
      canonical,
      'Training logged',
      toString(raw.summary || raw.message, 'Career training applied.'),
      toNumber(params.time_cost_units, 2),
      raw,
    );
  }

  if (canonical === 'debt_payment' || canonical === 'recovery_action') {
    const raw = await fetchApiWithFallback<Record<string, unknown>>(
      [`/finance/player/${playerId}/recovery-action`],
      {
        method: 'POST',
        body: JSON.stringify({
          action_key: toString(params.action_key, 'payment_plan_enroll'),
        }),
      },
    );
    return executionResponseBase(
      playerId,
      canonical,
      'Recovery action queued',
      toString(raw.action_queued, 'Recovery action applied.'),
      toNumber(params.time_cost_units, 1),
      raw,
    );
  }

  if (canonical === 'change_region') {
    const regionKey = toString(params.region_key || params.regionKey);
    if (!regionKey) {
      throw new Error('Region update needs region_key.');
    }
    const raw = await fetchApiWithFallback<Record<string, unknown>>(
      [`/housing/player/${playerId}/region`],
      {
        method: 'POST',
        body: JSON.stringify({
          region_key: regionKey,
          commute_mode: toString(params.commute_mode || params.commuteMode, 'car'),
        }),
      },
    );
    return executionResponseBase(
      playerId,
      canonical,
      'Region updated',
      toString(raw.message || raw.summary, 'Housing region changed.'),
      toNumber(params.time_cost_units, 1),
      raw,
    );
  }

  if (canonical === 'work_shift') {
    const raw = await fetchApiWithFallback<Record<string, unknown>>(
      [`/jobs/work`],
      {
        method: 'POST',
        body: JSON.stringify({
          job_name: toString(params.job_name || params.job || params.current_job, 'banker'),
          hours_worked: Math.max(1, Math.min(12, Math.round(toNumber(params.hours_worked, 4)))),
        }),
      },
    );
    return executionResponseBase(
      playerId,
      canonical,
      toString(raw.message, 'Work shift completed'),
      toString(raw.message, 'Work shift applied.'),
      toNumber(params.time_cost_units, 3),
      raw,
    );
  }

  if (canonical === 'side_income') {
    const raw = await fetchApiWithFallback<Record<string, unknown>>(
      [`/side-income/rideshare`],
      {
        method: 'POST',
        body: JSON.stringify({
          hours_worked: Math.max(1, Math.min(8, toNumber(params.hours_worked, 3))),
        }),
      },
    );
    return executionResponseBase(
      playerId,
      canonical,
      toString(raw.message, 'Rideshare completed'),
      toString(raw.message, 'Side-income action applied.'),
      toNumber(params.time_cost_units, 3),
      raw,
    );
  }

  throw new Error(`No mapped execution endpoint for action '${String(actionKey)}'.`);
}

export async function endDay(playerId: string): Promise<EndDayResponse> {
  try {
    const unified = await fetchApiWithFallback<Record<string, unknown>>(
      [
        `/gameplay/player/${playerId}/end-day`,
        `/gameplay/${playerId}/end-day`,
        `/player/${playerId}/end-day`,
      ],
      { method: 'POST', body: '{}' },
    );
    return normalizeEndDay(unified, playerId);
  } catch {
    // Fallback to legacy day progression endpoints below.
  }

  const raw = await fetchApiWithFallback<Record<string, unknown>>(
    [
      `/day/run/${playerId}`,
      `/day/settle/${playerId}`,
    ],
    { method: 'POST', body: '{}' },
  );
  return normalizeEndDay(raw, playerId);
}

export async function getPlayerNotifications(playerId: string): Promise<PlayerNotificationResponse> {
  try {
    const raw = await fetchApiWithFallback<Record<string, unknown>>([
      `/gameplay/player/${playerId}/notifications`,
      `/player/${playerId}/notifications`,
    ]);
    return normalizeNotifications(raw, playerId);
  } catch {
    return {
      player_id: playerId,
      as_of_date: '',
      notifications: [],
      debug_meta: { source: 'empty_fallback' },
    };
  }
}
