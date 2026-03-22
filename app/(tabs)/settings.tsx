import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import AppShell from '@/components/layout/AppShell';
import ContentStack from '@/components/layout/ContentStack';
import PageContainer from '@/components/layout/PageContainer';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SectionCard from '@/components/ui/SectionCard';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { theme } from '@/design/theme';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const [backendUrl, setBackendUrl] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [applyingUpdate, setApplyingUpdate] = useState(false);
  const [saving, setSaving] = useState(false);
  const loaded = useRef(false);

  const appName = Constants.expoConfig?.name || 'Gold Penny';
  const appSlug = Constants.expoConfig?.slug || 'pft-expo';
  const appVersion = Constants.expoConfig?.version || 'Unknown';
  const runtimeVersion = Updates.runtimeVersion || 'Unknown';
  const updateChannel = Updates.channel || 'default';

  const hasOverrides = useMemo(
    () => Boolean(backendUrl.trim() || adminToken.trim() || adminAddress.trim()),
    [backendUrl, adminToken, adminAddress],
  );

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const url = await AsyncStorage.getItem('backend:override');
        setBackendUrl(url || '');

        const token = await AsyncStorage.getItem('admin:token');
        setAdminToken(token || '');

        const addr = await AsyncStorage.getItem('admin:address');
        setAdminAddress(addr || '');
      } catch {
        Alert.alert('Settings', 'Unable to load saved settings. You can still enter new values below.');
      }
    })();
  }, []);

  const checkForUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const res = await Updates.checkForUpdateAsync();
      Alert.alert('Update Check', res.isAvailable ? 'A new update is available.' : 'You are already on the latest version.');
    } catch (e: any) {
      Alert.alert('Update Check Failed', e?.message || String(e));
    } finally {
      setCheckingUpdate(false);
    }
  };

  const fetchAndReload = async () => {
    setApplyingUpdate(true);
    try {
      const res = await Updates.checkForUpdateAsync();
      if (res.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
        return;
      }
      Alert.alert('No Update', 'No update is currently available.');
    } catch (e: any) {
      Alert.alert('Update Apply Failed', e?.message || String(e));
    } finally {
      setApplyingUpdate(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const normalizedBackend = backendUrl.trim();
      const normalizedToken = adminToken.trim();
      const normalizedAddress = adminAddress.trim();

      if (normalizedBackend && !/^https?:\/\//i.test(normalizedBackend)) {
        Alert.alert('Invalid URL', 'Please enter a valid http(s) URL');
        return;
      }

      if (normalizedBackend) {
        await AsyncStorage.setItem('backend:override', normalizedBackend);
      } else {
        await AsyncStorage.removeItem('backend:override');
      }

      if (normalizedToken) {
        await AsyncStorage.setItem('admin:token', normalizedToken);
      } else {
        await AsyncStorage.removeItem('admin:token');
      }

      if (normalizedAddress) {
        await AsyncStorage.setItem('admin:address', normalizedAddress);
      } else {
        await AsyncStorage.removeItem('admin:address');
      }

      setBackendUrl(normalizedBackend);
      setAdminToken(normalizedToken);
      setAdminAddress(normalizedAddress);
      Alert.alert('Saved', 'Settings have been saved. Active API requests will use these values immediately.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const resetOverrides = async () => {
    setSaving(true);
    try {
      await AsyncStorage.multiRemove(['backend:override', 'admin:token', 'admin:address']);
      setBackendUrl('');
      setAdminToken('');
      setAdminAddress('');
      Alert.alert('Reset Complete', 'Backend and admin overrides have been cleared.');
    } catch (e: any) {
      Alert.alert('Reset Failed', e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Settings" subtitle="Gold Penny app preferences">
      <PageContainer>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ContentStack gap={theme.spacing.md}>
            <SectionCard
              title="App Identity"
              summary="Current build and update channel information for this installation."
            >
              <InfoRow label="App" value={appName} />
              <InfoRow label="Slug" value={appSlug} />
              <InfoRow label="Version" value={appVersion} />
              <InfoRow label="Runtime" value={runtimeVersion} />
              <InfoRow label="Channel" value={updateChannel} />
            </SectionCard>

            <SectionCard
              title="App Updates"
              summary="Use these controls to check for and apply over-the-air updates."
            >
              <View style={styles.buttonRow}>
                <SecondaryButton
                  label={checkingUpdate ? 'Checking...' : 'Check for Updates'}
                  onPress={checkForUpdates}
                  disabled={checkingUpdate || applyingUpdate}
                />
                <PrimaryButton
                  label={applyingUpdate ? 'Applying...' : 'Fetch and Reload'}
                  onPress={fetchAndReload}
                  disabled={checkingUpdate || applyingUpdate}
                  loading={applyingUpdate}
                />
              </View>
            </SectionCard>

            <SectionCard
              title="Network and Admin Overrides"
              summary="Optional advanced settings for backend routing and authenticated admin requests."
            >
              <Text style={styles.inputLabel}>Backend URL Override</Text>
              <TextInput
                style={styles.input}
                placeholder="https://your-api.example.com"
                placeholderTextColor={theme.color.muted}
                value={backendUrl}
                onChangeText={setBackendUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>Admin Bearer Token</Text>
              <TextInput
                style={styles.input}
                placeholder="Optional admin token"
                placeholderTextColor={theme.color.muted}
                value={adminToken}
                onChangeText={setAdminToken}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>Admin Wallet Address</Text>
              <TextInput
                style={styles.input}
                placeholder="0x..."
                placeholderTextColor={theme.color.muted}
                value={adminAddress}
                onChangeText={setAdminAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.buttonRow}>
                <SecondaryButton
                  label="Reset Overrides"
                  onPress={hasOverrides ? resetOverrides : undefined}
                  disabled={!hasOverrides || saving}
                />
                <PrimaryButton
                  label="Save Settings"
                  onPress={saveSettings}
                  loading={saving}
                  disabled={saving}
                />
              </View>

              <Text style={styles.note}>
                These override values are stored locally on this device and only affect this app install.
              </Text>
            </SectionCard>
          </ContentStack>
        </ScrollView>
      </PageContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  infoLabel: {
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
    fontWeight: '600',
  },
  infoValue: {
    color: theme.color.textPrimary,
    ...theme.typography.bodySm,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  inputLabel: {
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    color: theme.color.textPrimary,
    backgroundColor: theme.color.surfaceAlt,
    ...theme.typography.bodyMd,
    minHeight: 44,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  note: {
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
  },
});
