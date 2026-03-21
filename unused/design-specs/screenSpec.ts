export interface ScreenSpec {
  screen: string;
  sections: string[];
  ctaPlacement: string;
  responsiveNotes: string;
  motionNotes: string;
}

export const screenSpecs: ScreenSpec[] = [
  {
    screen: 'GameplayHomeTemplate',
    sections: ['PlayerStatsBar', 'DailyBriefCard', 'StrategyRecommendationCard', 'ActionHubPanel', 'Secondary groups'],
    ctaPlacement: 'Action Hub CTA sits in primary flow; End Day in day controls.',
    responsiveNotes: 'Primary content always first; secondary sections collapsed on load.',
    motionNotes: 'Fade in section loads; expand/collapse for secondary groups.',
  },
  {
    screen: 'ActionPreviewTemplate',
    sections: ['Header', 'Impact rows', 'Blockers/Warnings', 'Footer actions'],
    ctaPlacement: 'Execute CTA in footer right; back action left.',
    responsiveNotes: 'Bottom sheet on mobile, centered modal on larger screens.',
    motionNotes: 'Slide-up + backdrop fade.',
  },
  {
    screen: 'SummaryTemplate',
    sections: ['Top outcome summary', 'Key deltas', 'Warnings and next-step prompt'],
    ctaPlacement: 'Primary next action at bottom of summary card.',
    responsiveNotes: 'Single-column stack for narrow widths.',
    motionNotes: 'Minimal fade for result reveal.',
  },
  {
    screen: 'InsightTemplate',
    sections: ['Insight column A', 'Insight column B (optional)'],
    ctaPlacement: 'No mandatory CTA; insights support action decision.',
    responsiveNotes: '1-column mobile, 2-column tablet/desktop.',
    motionNotes: 'No heavy transition, only local collapses.',
  },
  {
    screen: 'OnboardingTemplate',
    sections: ['OnboardingBanner', 'Coachmark/Progress', 'Unlock preview'],
    ctaPlacement: 'Advance/Skip actions in onboarding banner.',
    responsiveNotes: 'Advanced sections hidden or collapsed during onboarding.',
    motionNotes: 'Subtle highlight and fade only.',
  },
];
