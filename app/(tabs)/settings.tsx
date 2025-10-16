import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Switch, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

export default function SettingsScreen() {
  const [autoUpdate, setAutoUpdate] = useState<boolean>(true);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const v = await AsyncStorage.getItem('autoUpdateEnabled');
        if (v !== null) setAutoUpdate(v === '1');
      } catch {}
    })();
  }, []);

  const onToggle = async (val: boolean) => {
    setAutoUpdate(val);
    try { await AsyncStorage.setItem('autoUpdateEnabled', val ? '1' : '0'); } catch {}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Auto update on launch</Text>
        <Switch value={autoUpdate} onValueChange={onToggle} />
      </View>

      <View style={{ height: 16 }} />
      <Button title="Check for update now" onPress={async () => {
        try {
          const res = await Updates.checkForUpdateAsync();
          alert(res.isAvailable ? 'Update available' : 'No update available');
        } catch (e: any) {
          alert(`Check failed: ${e?.message || e}`);
        }
      }} />
      <View style={{ height: 8 }} />
      <Button title="Fetch & reload now" onPress={async () => {
        try {
          const res = await Updates.checkForUpdateAsync();
          if (res.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          } else {
            alert('No update available');
          }
        } catch (e: any) {
          alert(`Fetch/reload failed: ${e?.message || e}`);
        }
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
  },
});
