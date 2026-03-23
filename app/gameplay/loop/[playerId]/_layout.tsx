import React from 'react';
import { Redirect, Slot, useLocalSearchParams } from 'expo-router';

import { GameplayLoopProvider } from '@/features/gameplayLoop/context';

export default function GameplayLoopLayout() {
  const params = useLocalSearchParams<{ playerId?: string }>();
  const rawPlayerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;
  const playerId = String(rawPlayerId || '').trim();

  if (!playerId) {
    return <Redirect href="/gameplay" />;
  }

  return (
    <GameplayLoopProvider playerId={playerId}>
      <Slot />
    </GameplayLoopProvider>
  );
}
