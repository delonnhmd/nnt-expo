export interface ComponentVariantSpec {
  component: string;
  purpose: string;
  spacingRule: string;
  variants: string[];
  motion: string;
  responsive: string;
}

export const componentSpecs: ComponentVariantSpec[] = [
  {
    component: 'PrimaryButton',
    purpose: 'Primary CTA for high-intent actions.',
    spacingRule: '44px min touch target, horizontal padding uses spacing.lg.',
    variants: ['default', 'pressed', 'disabled', 'loading'],
    motion: 'Fast opacity feedback (<=140ms).',
    responsive: 'Full width on mobile rows, compact on tablet/desktop.',
  },
  {
    component: 'SurfaceCard',
    purpose: 'Base surface for all cards and grouped content.',
    spacingRule: 'Default internal padding uses spacing.md.',
    variants: ['default', 'highlighted', 'warning', 'muted'],
    motion: 'No intrinsic motion.',
    responsive: 'Stacks full-width on mobile, grid-compatible on tablet.',
  },
  {
    component: 'SecondaryDashboardSection',
    purpose: 'Collapsible grouped section for secondary insights.',
    spacingRule: 'Header + summary row always visible; body gap spacing.sm.',
    variants: ['collapsed', 'expanded', 'loading', 'partial', 'error'],
    motion: 'Expand/collapse with base duration (200ms).',
    responsive: 'Collapsed by default across breakpoints.',
  },
  {
    component: 'Badge/StatusChip',
    purpose: 'Compact severity and state labels.',
    spacingRule: 'Pill token radius with spacing.xs horizontal padding.',
    variants: ['info', 'success', 'warning', 'danger', 'locked', 'neutral'],
    motion: 'No intrinsic motion.',
    responsive: 'Wrap-safe and compact for narrow devices.',
  },
  {
    component: 'ActionPreviewTemplate',
    purpose: 'Reusable zone layout for action preview and confirmation.',
    spacingRule: 'Header/body/footer zone padding uses spacing.lg/md.',
    variants: ['sheet-mobile', 'center-modal-tablet+'],
    motion: 'Slide-up panel with fade backdrop.',
    responsive: 'Uses sheet on mobile, centered modal on larger screens.',
  },
];
