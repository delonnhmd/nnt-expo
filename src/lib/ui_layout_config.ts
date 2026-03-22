export type SecondaryGroupKey =
  | 'economy_overview'
  | 'business_insights'
  | 'planning_commitment'
  | 'progression'
  | 'world_memory';

export interface SecondaryGroupConfig {
  key: SecondaryGroupKey;
  title: string;
  sectionDependencies: string[];
  defaultCollapsed: boolean;
}

export const PRIMARY_SECTION_KEYS = [
  'player_stats',
  'daily_brief',
  'strategic_recommendation',
  'action_hub',
] as const;

export const SECONDARY_GROUP_CONFIGS: SecondaryGroupConfig[] = [
  {
    key: 'economy_overview',
    title: 'Economy + Market',
    sectionDependencies: [
      'market_overview',
      'price_trends',
      'commute_pressure',
      'housing_tradeoff',
      'economy_explainer',
      'future_teasers',
    ],
    defaultCollapsed: true,
  },
  {
    key: 'business_insights',
    title: 'Business + Margins',
    sectionDependencies: ['business_margins', 'business_plan'],
    defaultCollapsed: true,
  },
  {
    key: 'planning_commitment',
    title: 'Planning + Commitment',
    sectionDependencies: [
      'strategic_planning',
      'debt_growth',
      'recovery_vs_push',
      'commitment',
      'future_preparation',
    ],
    defaultCollapsed: true,
  },
  {
    key: 'progression',
    title: 'Progression',
    sectionDependencies: ['progression', 'weekly_summary', 'weekly_missions'],
    defaultCollapsed: true,
  },
  {
    key: 'world_memory',
    title: 'World Memory',
    sectionDependencies: ['world_memory'],
    defaultCollapsed: true,
  },
];

export const UI_LAYOUT_CONFIG = {
  primarySections: PRIMARY_SECTION_KEYS,
  secondaryGroups: SECONDARY_GROUP_CONFIGS,
  onboarding: {
    hideSecondaryDuringOnboarding: true,
    forceCollapseSecondary: true,
  },
  hideByDefault: [
    'player_state',
    'risk_opportunity',
    'quick_actions',
  ],
};
