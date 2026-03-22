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

export default function GameplayIndexRoute() {
  const [playerId, setPlayerId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const remembered = await AsyncStorage.getItem('gameplay:lastPlayerId');
        if (remembered) setPlayerId(remembered);
      } catch {
        // Ignore storage read issues and allow manual entry.
      }
    })();
  }, []);

  const openDashboard = async () => {
    const trimmed = playerId.trim();
    if (!trimmed) return;
    try {
      await AsyncStorage.setItem('gameplay:lastPlayerId', trimmed);
    } catch {
      // Persisting last player is optional.
    }
    router.push(`/gameplay/${trimmed}`);
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
            summary="Enter your player ID to open the live daily simulation."
          >
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              value={playerId}
              onChangeText={setPlayerId}
              placeholder="Player ID (for example: demo-player-1)"
              placeholderTextColor={theme.color.muted}
            />
            <Text style={styles.hint}>The last player ID is remembered on this device for faster access.</Text>
            <PrimaryButton
              label="Open Dashboard"
              onPress={openDashboard}
              disabled={!playerId.trim()}
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
});
