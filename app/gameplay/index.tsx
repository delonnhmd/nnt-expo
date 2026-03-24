import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import AppShell from '@/components/layout/AppShell';
import ContentStack from '@/components/layout/ContentStack';
import PageContainer from '@/components/layout/PageContainer';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SectionCard from '@/components/ui/SectionCard';
import { theme } from '@/design/theme';
import { createPlayablePlayer, getPlayablePlayerSummary } from '@/lib/api/onboarding';
import { recordInfo, recordWarning } from '@/lib/logger';

const PLAYER_ID_STORAGE_KEY = 'goldpenny:gameplay:lastPlayerId';
const LEGACY_PLAYER_ID_STORAGE_KEY = 'gameplay:lastPlayerId';
const DEFAULT_PLAYER_ID = 'player1';
const DEV_AUTO_CREATE_PLAYER =
  __DEV__
  || process.env.EXPO_PUBLIC_DEV_AUTO_CREATE_PLAYER === 'true'
  || process.env.EXPO_PUBLIC_DEV_AUTO_CREATE_PLAYER === '1';

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error || 'Unknown error');
}

function isPlayerMissingError(error: unknown): boolean {
  const message = normalizeErrorMessage(error).toLowerCase();
  return (
    message.includes('player not found')
    || message.includes('profile not found')
    || message.includes('user not found')
  );
}

export default function GameplayIndexRoute() {
  const [playerId, setPlayerId] = useState(DEFAULT_PLAYER_ID);
  const [opening, setOpening] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [entryInfo, setEntryInfo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const remembered =
          (await AsyncStorage.getItem(PLAYER_ID_STORAGE_KEY)) ||
          (await AsyncStorage.getItem(LEGACY_PLAYER_ID_STORAGE_KEY));
        if (remembered) {
          setPlayerId(remembered);
        } else {
          setPlayerId(DEFAULT_PLAYER_ID);
        }
      } catch {
        // Ignore storage read issues and allow manual entry.
      }
    })();
  }, []);

  const openDashboard = async () => {
    const requestedPlayerId = playerId.trim();
    let resolvedPlayerId = requestedPlayerId;

    setEntryError(null);
    setEntryInfo(null);

    const trimmed = requestedPlayerId;
    if (!trimmed) return;

    setOpening(true);

    try {
      try {
        await getPlayablePlayerSummary(requestedPlayerId);
        recordInfo('gameplayEntry', 'Playable player validated.', {
          action: 'validate_player',
          context: {
            requestedPlayerId,
          },
        });
      } catch (validationError) {
        if (!isPlayerMissingError(validationError)) {
          const message = normalizeErrorMessage(validationError);
          setEntryInfo('Backend validation skipped. Opening loop with fallback data if needed.');
          recordWarning('gameplayEntry', 'Player validation failed with non-not-found error; allowing loop entry.', {
            action: 'validate_player_non_blocking',
            context: {
              requestedPlayerId,
              message,
            },
            error: validationError,
          });
        } else if (DEV_AUTO_CREATE_PLAYER) {
          const created = await createPlayablePlayer({
            display_name: requestedPlayerId,
            gender: 'male',
            region: 'suburban',
            starter_job_code: 'retail_worker',
          });
          if (!created.player_id) {
            throw new Error('Backend did not return a player_id for created dev player.');
          }
          resolvedPlayerId = created.player_id;
          setEntryInfo(`Created a new dev player for "${requestedPlayerId}" and mapped to ${resolvedPlayerId}.`);
          setPlayerId(resolvedPlayerId);
          recordInfo('gameplayEntry', 'Auto-created dev player from missing player id.', {
            action: 'auto_create_player',
            context: {
              requestedPlayerId,
              resolvedPlayerId,
            },
          });
        } else {
          setEntryError(`Player "${requestedPlayerId}" was not found. Enter a valid existing player ID.`);
          recordWarning('gameplayEntry', 'Blocked loop entry because player id was not found.', {
            action: 'validate_player_blocked',
            context: {
              requestedPlayerId,
            },
            error: validationError,
          });
          return;
        }
      }

      try {
        await AsyncStorage.setItem(PLAYER_ID_STORAGE_KEY, resolvedPlayerId);
      } catch {
        // Persisting last player is optional.
      }
      router.push(`/gameplay/loop/${resolvedPlayerId}/brief`);
    } catch (error) {
      const message = normalizeErrorMessage(error);
      setEntryError(message);
      recordWarning('gameplayEntry', 'Failed to open gameplay loop.', {
        action: 'open_loop',
        context: {
          requestedPlayerId,
          resolvedPlayerId,
          message,
        },
        error,
      });
    } finally {
      setOpening(false);
    }
  };

  return (
    <AppShell
      title="Gold Penny"
      subtitle="Continue your gameplay session"
    >
      <PageContainer>
        <ContentStack style={styles.content}>
          <SectionCard
            title="Gameplay Dashboard"
            summary="Enter your player ID to open the mobile gameplay loop screens."
          >
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              value={playerId}
              onChangeText={setPlayerId}
              placeholder={`Player ID (default: ${DEFAULT_PLAYER_ID})`}
              placeholderTextColor={theme.color.muted}
              editable={!opening}
            />
            <Text style={styles.hint}>The last player ID is stored on this device so you can return to gameplay more quickly.</Text>
            {entryInfo ? <Text style={styles.infoText}>{entryInfo}</Text> : null}
            {entryError ? <Text style={styles.errorText}>{entryError}</Text> : null}
            <PrimaryButton
              label={opening ? 'Opening Gameplay Loop...' : 'Open Gameplay Loop'}
              onPress={openDashboard}
              disabled={!playerId.trim() || opening}
              loading={opening}
            />
          </SectionCard>
        </ContentStack>
      </PageContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: theme.spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    color: theme.color.textPrimary,
    ...theme.typography.bodyMd,
    backgroundColor: theme.color.surfaceAlt,
    minHeight: 44,
  },
  hint: {
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
  },
  infoText: {
    color: '#1e3a8a',
    ...theme.typography.bodySm,
    fontWeight: '700',
  },
  errorText: {
    color: theme.color.danger,
    ...theme.typography.bodySm,
    fontWeight: '700',
  },
});
