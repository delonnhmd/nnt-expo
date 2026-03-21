import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import GameDashboardPage from '@/pages/gameplay/GameDashboardPage';

export default function GameplayPlayerRoute() {
  const params = useLocalSearchParams<{ playerId?: string }>();
  const rawPlayerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;
  const playerId = rawPlayerId || '';

  return <GameDashboardPage playerId={playerId} />;
}
