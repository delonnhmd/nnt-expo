import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { KEY_ADMIN_TOKEN, KEY_BACKEND_OVERRIDE } from '@/lib/apiClient';
import * as Updates from 'expo-updates';

import AppShell from '@/components/layout/AppShell';
import ContentStack from '@/components/layout/ContentStack';
import PageContainer from '@/components/layout/PageContainer';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SectionCard from '@/components/ui/SectionCard';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { theme } from '@/design/theme';
import {
  clearRecentDiagnostics,
  DiagnosticEntry,
  getRecentDiagnostics,
  recordError,
  recordInfo,
  recordWarning,
} from '@/lib/logger';

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
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [applyingUpdate, setApplyingUpdate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([]);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [clearingDiagnostics, setClearingDiagnostics] = useState(false);
  const loaded = useRef(false);

  const appName = Constants.expoConfig?.name || 'Gold Penny';
  const appSlug = Constants.expoConfig?.slug || 'gold-penny-expo';
  const appVersion = Constants.expoConfig?.version || 'Unknown';
  const runtimeVersion = Updates.runtimeVersion || 'Unknown';
  const updateChannel = Updates.channel || 'default';
  const mainWebsite = 'https://www.pennyfloat.com';
  const gameplayWebsite = 'https://goldpenny.pennyfloat.com';

  const hasOverrides = useMemo(
    () => Boolean(backendUrl.trim() || adminToken.trim()),
    [backendUrl, adminToken],
  );

  const loadDiagnostics = async () => {
    setDiagnosticsLoading(true);
    try {
      const entries = await getRecentDiagnostics();
      setDiagnostics(entries);
    } catch (error) {
      recordWarning('settings', 'Failed to load recent diagnostics.', {
        action: 'load_diagnostics',
        error,
      });
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const [url, token] = await Promise.all([
          AsyncStorage.getItem(KEY_BACKEND_OVERRIDE),
          AsyncStorage.getItem(KEY_ADMIN_TOKEN),
        ]);
        setBackendUrl(url || '');
        setAdminToken(token || '');
      } catch (error) {
        recordWarning('settings', 'Failed to hydrate saved settings.', {
          action: 'load_settings',
          error,
        });
        Alert.alert('Settings', 'Unable to load saved settings. You can still enter new values below.');
      }
      await loadDiagnostics();
    })();
  }, []);

  const checkForUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const res = await Updates.checkForUpdateAsync();
      recordInfo('settings', 'Checked for updates.', {
        action: 'check_for_updates',
        context: {
          isAvailable: res.isAvailable,
        },
      });
      Alert.alert('Update Check', res.isAvailable ? 'A new update is available.' : 'You are already on the latest version.');
    } catch (e: any) {
      recordError('settings', 'Update check failed.', {
        action: 'check_for_updates',
        error: e,
      });
      Alert.alert('Update Check Failed', e?.message || String(e));
    } finally {
      setCheckingUpdate(false);
      await loadDiagnostics();
    }
  };

  const fetchAndReload = async () => {
    setApplyingUpdate(true);
    try {
      const res = await Updates.checkForUpdateAsync();
      if (res.isAvailable) {
        recordInfo('settings', 'Fetched OTA update and reloading.', {
          action: 'fetch_and_reload',
        });
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
        return;
      }
      Alert.alert('No Update', 'No update is currently available.');
    } catch (e: any) {
      recordError('settings', 'Update fetch or reload failed.', {
        action: 'fetch_and_reload',
        error: e,
      });
      Alert.alert('Update Apply Failed', e?.message || String(e));
    } finally {
      setApplyingUpdate(false);
      await loadDiagnostics();
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const normalizedBackend = backendUrl.trim();
      const normalizedToken = adminToken.trim();

      if (normalizedBackend && !/^https?:\/\//i.test(normalizedBackend)) {
        Alert.alert('Invalid URL', 'Please enter a valid http(s) URL');
        return;
      }

      if (normalizedBackend) {
        await AsyncStorage.setItem(KEY_BACKEND_OVERRIDE, normalizedBackend);
      } else {
        await AsyncStorage.removeItem(KEY_BACKEND_OVERRIDE);
      }

      if (normalizedToken) {
        await AsyncStorage.setItem(KEY_ADMIN_TOKEN, normalizedToken);
      } else {
        await AsyncStorage.removeItem(KEY_ADMIN_TOKEN);
      }

      setBackendUrl(normalizedBackend);
      setAdminToken(normalizedToken);
      recordInfo('settings', 'Local override settings saved.', {
        action: 'save_settings',
        context: {
          hasBackendOverride: Boolean(normalizedBackend),
          hasAdminToken: Boolean(normalizedToken),
        },
      });
      Alert.alert('Saved', 'Advanced settings have been saved for this device.');
    } catch (e: any) {
      recordError('settings', 'Saving override settings failed.', {
        action: 'save_settings',
        error: e,
      });
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setSaving(false);
      await loadDiagnostics();
    }
  };

  const resetOverrides = async () => {
    setSaving(true);
    try {
      await AsyncStorage.multiRemove([KEY_BACKEND_OVERRIDE, KEY_ADMIN_TOKEN, 'admin:address']);
      setBackendUrl('');
      setAdminToken('');
      recordInfo('settings', 'Local overrides reset.', {
        action: 'reset_overrides',
      });
      Alert.alert('Reset Complete', 'Advanced settings have been cleared for this device.');
    } catch (e: any) {
      recordError('settings', 'Resetting override settings failed.', {
        action: 'reset_overrides',
        error: e,
      });
      Alert.alert('Reset Failed', e?.message || String(e));
    } finally {
      setSaving(false);
      await loadDiagnostics();
    }
  };

  const handleClearDiagnostics = async () => {
    setClearingDiagnostics(true);
    try {
      await clearRecentDiagnostics();
      recordInfo('settings', 'Cleared recent diagnostics.', {
        action: 'clear_diagnostics',
      });
      await loadDiagnostics();
    } catch (error) {
      recordError('settings', 'Clearing recent diagnostics failed.', {
        action: 'clear_diagnostics',
        error,
      });
      Alert.alert('Clear Diagnostics Failed', error instanceof Error ? error.message : String(error));
    } finally {
      setClearingDiagnostics(false);
    }
  };

  return (
    <AppShell title="Settings" subtitle="Gold Penny app preferences">
      <PageContainer>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ContentStack gap={theme.spacing.md}>
            <SectionCard
              title="App Identity"
              summary="Current build, release channel, and brand identity information for this installation."
            >
              <InfoRow label="App" value={appName} />
              <InfoRow label="Slug" value={appSlug} />
              <InfoRow label="Version" value={appVersion} />
              <InfoRow label="Runtime" value={runtimeVersion} />
              <InfoRow label="Channel" value={updateChannel} />
              <InfoRow label="Website" value={mainWebsite} />
              <InfoRow label="Game Site" value={gameplayWebsite} />
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
              title="Advanced API Settings"
              summary="Optional support and QA overrides for server routing and authenticated maintenance requests. Gameplay does not require external account setup."
            >
              <Text style={styles.inputLabel}>Server URL Override</Text>
              <TextInput
                style={styles.input}
                placeholder="https://your-api.example.com"
                placeholderTextColor={theme.color.muted}
                value={backendUrl}
                onChangeText={setBackendUrl}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="url"
                keyboardType="url"
              />

              <Text style={styles.inputLabel}>Support Access Token</Text>
              <TextInput
                style={styles.input}
                placeholder="Optional support token"
                placeholderTextColor={theme.color.muted}
                value={adminToken}
                onChangeText={setAdminToken}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                secureTextEntry
              />

              <View style={styles.buttonRow}>
                <SecondaryButton
                  label="Reset Advanced Settings"
                  onPress={hasOverrides ? resetOverrides : undefined}
                  disabled={!hasOverrides || saving}
                />
                <PrimaryButton
                  label="Save Advanced Settings"
                  onPress={saveSettings}
                  loading={saving}
                  disabled={saving}
                />
              </View>

              <Text style={styles.note}>
                These values are stored locally on this device and only affect this app install.
              </Text>
            </SectionCard>

            <SectionCard
              title="Recent Diagnostics"
              summary="Recent startup, network, persistence, gameplay, and optional integration issues captured on this device. Sensitive values are redacted before storage."
            >
              <View style={styles.buttonRow}>
                <SecondaryButton
                  label={diagnosticsLoading ? 'Refreshing...' : 'Refresh Diagnostics'}
                  onPress={diagnosticsLoading ? undefined : loadDiagnostics}
                  disabled={diagnosticsLoading || clearingDiagnostics}
                />
                <SecondaryButton
                  label={clearingDiagnostics ? 'Clearing...' : 'Clear Diagnostics'}
                  onPress={clearingDiagnostics ? undefined : handleClearDiagnostics}
                  disabled={diagnosticsLoading || clearingDiagnostics}
                />
              </View>

              {diagnostics.length === 0 ? (
                <Text style={styles.note}>No diagnostics captured yet on this device.</Text>
              ) : (
                diagnostics.slice(0, 8).map((entry) => {
                  const levelStyle =
                    entry.level === 'error'
                      ? styles.diagnosticLevelError
                      : entry.level === 'warn'
                        ? styles.diagnosticLevelWarn
                        : styles.diagnosticLevelInfo;
                  return (
                    <View key={entry.id} style={styles.diagnosticCard}>
                      <View style={styles.diagnosticHeader}>
                        <Text style={[styles.diagnosticLevel, levelStyle]}>{entry.level.toUpperCase()}</Text>
                        <Text style={styles.diagnosticMeta} numberOfLines={1}>{entry.source}</Text>
                      </View>
                      <Text style={styles.diagnosticMessage}>{entry.message}</Text>
                      <Text style={styles.diagnosticTime}>{new Date(entry.timestamp).toLocaleString()}</Text>
                    </View>
                  );
                })
              )}
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
  diagnosticCard: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfaceAlt,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xxs,
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  diagnosticLevel: {
    ...theme.typography.bodySm,
    fontWeight: '800',
  },
  diagnosticLevelInfo: {
    color: '#1d4ed8',
  },
  diagnosticLevelWarn: {
    color: '#b45309',
  },
  diagnosticLevelError: {
    color: '#b91c1c',
  },
  diagnosticMeta: {
    flex: 1,
    color: theme.color.textSecondary,
    ...theme.typography.bodySm,
    fontWeight: '600',
  },
  diagnosticMessage: {
    color: theme.color.textPrimary,
    ...theme.typography.bodySm,
  },
  diagnosticTime: {
    color: theme.color.textSecondary,
    ...theme.typography.caption,
  },
});
