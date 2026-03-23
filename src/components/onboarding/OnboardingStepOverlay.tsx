import React, { useState } from 'react';

import { useOnboarding } from '@/features/onboarding';

import OnboardingTooltip from './OnboardingTooltip';

export default function OnboardingStepOverlay() {
  const onboarding = useOnboarding();
  const [busyAction, setBusyAction] = useState<'continue' | 'skip' | null>(null);

  if (!onboarding.isActive || !onboarding.currentStep) return null;

  const handleContinue = async () => {
    if (!onboarding.canContinueCurrentStep) return;
    setBusyAction('continue');
    try {
      await onboarding.continueCurrentStep();
    } finally {
      setBusyAction(null);
    }
  };

  const handleSkip = async () => {
    setBusyAction('skip');
    try {
      await onboarding.skipOnboarding();
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <OnboardingTooltip
      progressLabel={onboarding.progressLabel}
      title={onboarding.currentStep.title}
      message={onboarding.currentStep.body}
      statusMessage={onboarding.requirementStatus}
      blockedMessage={onboarding.blockedNavigationMessage}
      continueLabel={onboarding.continueLabel}
      onContinue={onboarding.canContinueCurrentStep ? handleContinue : undefined}
      onSkip={handleSkip}
      continueDisabled={!onboarding.canContinueCurrentStep}
      continueLoading={busyAction === 'continue'}
      skipLoading={busyAction === 'skip'}
    />
  );
}