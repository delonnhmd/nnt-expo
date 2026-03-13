import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Switch, StyleSheet, Button, TextInput, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

export default function SettingsScreen() {
  const [autoUpdate, setAutoUpdate] = useState<boolean>(true);
  const [backendUrl, setBackendUrl] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const v = await AsyncStorage.getItem('autoUpdateEnabled');
        if (v !== null) setAutoUpdate(v === '1');
        
        const url = await AsyncStorage.getItem('backend:override');
        setBackendUrl(url || '');
        
        const token = await AsyncStorage.getItem('admin:token');
        setAdminToken(token || '');
        
        const addr = await AsyncStorage.getItem('admin:address');
        setAdminAddress(addr || '');
      } catch {}
    })();
  }, []);

  const onToggle = async (val: boolean) => {
    setAutoUpdate(val);
    try { await AsyncStorage.setItem('autoUpdateEnabled', val ? '1' : '0'); } catch {}
  };

  const saveSettings = async () => {
    try {
      // Validate backend URL if provided
      if (backendUrl && !/^https?:\/\//i.test(backendUrl)) {
        Alert.alert('Invalid URL', 'Please enter a valid http(s) URL');
        return;
      }
      
      // Save backend URL
      if (backendUrl) {
        await AsyncStorage.setItem('backend:override', backendUrl);
      } else {
        await AsyncStorage.removeItem('backend:override');
      }
      
      // Save admin token
      if (adminToken) {
        await AsyncStorage.setItem('admin:token', adminToken);
      } else {
        await AsyncStorage.removeItem('admin:token');
      }
      
      // Save admin address
      if (adminAddress) {
        await AsyncStorage.setItem('admin:address', adminAddress);
      } else {
        await AsyncStorage.removeItem('admin:address');
      }
      
      Alert.alert('Saved', 'Settings saved successfully! Restart the app to apply changes.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || String(e));
    }
  };

  return (
    <ScrollView style={styles.container}>
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

      <View style={{ height: 32 }} />
      <Text style={styles.sectionTitle}>Backend Configuration</Text>
      
      <Text style={styles.label}>Backend URL Override</Text>
      <TextInput
        style={styles.input}
        placeholder="https://your-tunnel.trycloudflare.com"
        value={backendUrl}
        onChangeText={setBackendUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={{ height: 16 }} />
      <Text style={styles.sectionTitle}>Admin Configuration</Text>
      
      <Text style={styles.label}>Admin Bearer Token</Text>
      <TextInput
        style={styles.input}
        placeholder="adm_123|GOD"
        value={adminToken}
        onChangeText={setAdminToken}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={{ height: 12 }} />
      <Text style={styles.label}>Admin Address</Text>
      <TextInput
        style={styles.input}
        placeholder="0xYourAdminAddress"
        value={adminAddress}
        onChangeText={setAdminAddress}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={{ height: 24 }} />
      <Button title="Save Settings" onPress={saveSettings} />
      <View style={{ height: 40 }} />
    </ScrollView>
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
    marginBottom: 8,
    fontWeight: '600',
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
});
