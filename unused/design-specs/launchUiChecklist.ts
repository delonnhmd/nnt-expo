export interface LaunchUiChecklistItem {
  area: string;
  responsiveReady: boolean;
  tokenized: boolean;
  sharedPrimitives: boolean;
  motionReady: boolean;
  figmaReady: boolean;
  notes?: string;
}

export const launchUiChecklist: LaunchUiChecklistItem[] = [
  {
    area: 'Gameplay dashboard',
    responsiveReady: true,
    tokenized: true,
    sharedPrimitives: true,
    motionReady: true,
    figmaReady: true,
    notes: 'Primary/secondary hierarchy and collapse model implemented.',
  },
  {
    area: 'Action preview',
    responsiveReady: true,
    tokenized: true,
    sharedPrimitives: true,
    motionReady: true,
    figmaReady: true,
    notes: 'Bottom-sheet behavior on mobile, centered modal on larger breakpoints.',
  },
  {
    area: 'End-of-day summary',
    responsiveReady: true,
    tokenized: false,
    sharedPrimitives: false,
    motionReady: true,
    figmaReady: true,
    notes: 'Template mapping defined; deeper card tokenization can be incrementally applied.',
  },
  {
    area: 'Weekly summary',
    responsiveReady: true,
    tokenized: false,
    sharedPrimitives: false,
    motionReady: true,
    figmaReady: true,
    notes: 'Grouped under progression section and mobile-safe stacking in place.',
  },
  {
    area: 'Onboarding flow',
    responsiveReady: true,
    tokenized: false,
    sharedPrimitives: false,
    motionReady: true,
    figmaReady: true,
    notes: 'Visibility override preserved with clear highlighted section behavior.',
  },
];
