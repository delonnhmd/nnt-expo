import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [value, setValue] = React.useState('');
  const [current, setCurrent] = React.useState('');
  const [adminToken, setAdminToken] = React.useState('');
  const [adminAddress, setAdminAddress] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem('backend:override');
        setCurrent(v || '');
        const t = await AsyncStorage.getItem('admin:token');
        setAdminToken(t || '');
        const a = await AsyncStorage.getItem('admin:address');
        setAdminAddress(a || '');
      } catch {}
    })();
  }, []);

  const save = async () => {
    try {
      if (value && !/^https?:\/\//i.test(value)) {
        Alert.alert('Invalid URL', 'Please enter a valid http(s) URL');
        return;
      }
      if (value) await AsyncStorage.setItem('backend:override', value);
      else await AsyncStorage.removeItem('backend:override');
      setCurrent(value);
      // Save admin token/address
      if (adminToken) await AsyncStorage.setItem('admin:token', adminToken); else await AsyncStorage.removeItem('admin:token');
      if (adminAddress) await AsyncStorage.setItem('admin:address', adminAddress); else await AsyncStorage.removeItem('admin:address');
      Alert.alert('Saved', 'Backend URL override updated. Restart app to ensure full effect.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.label}>Backend URL Override</Text>
      <TextInput
        placeholder="https://your-tunnel.trycloudflare.com"
        value={value}
        onChangeText={setValue}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.label}>Admin Bearer Token</Text>
      <TextInput
        placeholder="adm_123|GOD"
        value={adminToken}
        onChangeText={setAdminToken}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.label}>Admin Address (for address-based admin endpoints)</Text>
      <TextInput
        placeholder="0xYourAdminAddress"
        value={adminAddress}
        onChangeText={setAdminAddress}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={styles.button} onPress={save}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
      <Text style={styles.current}>Current override: {current || '— (using EXPO_PUBLIC_BACKEND)'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 16, gap: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  label: { fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10 },
  button: { backgroundColor: '#111827', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '700' },
  current: { marginTop: 10, color: '#374151' },
});
