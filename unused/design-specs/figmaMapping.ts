import { componentSpecs } from '@/design/componentSpec';
import { screenSpecs } from '@/design/screenSpec';

export interface FigmaMappingEntry {
  screenName: string;
  sectionOrder: string[];
  componentRefs: string[];
  responsiveNotes: string;
  motionNotes: string;
}

export const figmaScreenMapping: FigmaMappingEntry[] = [
  {
    screenName: 'Gameplay Dashboard',
    sectionOrder: [
      'PlayerStatsBar',
      'DailyBriefCard',
      'StrategyRecommendationCard',
      'ActionHubPanel',
      'Economy + Market (collapsed)',
      'Business + Margins (collapsed)',
      'Planning + Commitment (collapsed)',
      'Progression (collapsed)',
      'World Memory (collapsed)',
    ],
    componentRefs: [
      'PrimaryDashboardSection',
      'SecondaryDashboardSection',
      'SectionHeader',
      'SectionSummaryRow',
      'SurfaceCard',
      'StatusChip',
    ],
    responsiveNotes: 'Primary section stack is fixed; secondary sections collapse by default and expand per user intent.',
    motionNotes: 'Fade-in for section loads, 200ms expand/collapse for secondary groups.',
  },
  {
    screenName: 'Action Preview',
    sectionOrder: ['Header', 'Impact rows', 'Risk blocks', 'Footer actions'],
    componentRefs: ['ActionPreviewTemplate', 'PrimaryButton', 'SecondaryButton', 'SlideUpPanel'],
    responsiveNotes: 'Bottom sheet on mobile, centered modal on tablet/desktop.',
    motionNotes: 'Slide-up panel with backdrop fade.',
  },
  {
    screenName: 'Onboarding',
    sectionOrder: ['OnboardingBanner', 'OnboardingCoachmark', 'OnboardingProgress', 'Unlock preview'],
    componentRefs: ['OnboardingTemplate', 'StatusChip', 'SectionCard'],
    responsiveNotes: 'Advanced groups hidden/collapsed while onboarding active.',
    motionNotes: 'Minimal fade and highlight ring.',
  },
];

export const figmaComponentCatalog = componentSpecs;
export const figmaScreenCatalog = screenSpecs;
