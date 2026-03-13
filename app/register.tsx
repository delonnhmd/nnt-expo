import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useWallet } from '@/hooks';
import { getApi } from '@/lib/api';
import TopStatusBar from '@/components/TopStatusBar';

// Simple button component
function Button({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function RegisterScreen() {
  const { address, connect } = useWallet();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  // Check if user already has a profile on mount
  useEffect(() => {
    (async () => {
      try {
        const api = await getApi();
        const result = await api.getMyProfile();
        if (result.ok && result.profile) {
          setExistingProfile(result.profile);
          // User already registered, show message and redirect after delay
          Alert.alert(
            'Already Registered',
            `Welcome back ${result.profile.username}! Redirecting to home...`,
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
          setTimeout(() => router.replace('/(tabs)'), 2000);
        }
      } catch (e) {
        console.log('No existing profile found, proceeding with registration');
      } finally {
        setCheckingProfile(false);
      }
    })();
  }, []);

  const handleRegister = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!address) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const api = await getApi();
      const result = await api.register(username, address);
      console.log('Registration successful:', result);
      Alert.alert(
        'Success!', 
        `Welcome ${username}! You've received 10 NNT and 100 GNNT to get started. You can now post and vote!`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );
    } catch (e: any) {
      console.error('Registration error:', e);
      // Check if it's a username already taken error
      const errorMsg = e?.message || String(e);
      if (errorMsg.toLowerCase().includes('username already taken') || errorMsg.toLowerCase().includes('already taken')) {
        Alert.alert(
          'Username Not Available', 
          `The username "${username}" is already taken. Please choose a different username.`
        );
      } else {
        Alert.alert('Registration failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connect();
      Alert.alert('Success', 'Wallet connected! Now enter your username to complete registration.');
    } catch (e: any) {
      console.error('Wallet connection error:', e);
      Alert.alert('Connection failed', e?.message || String(e));
    }
  };

  return (
    <View style={styles.container}>
      <TopStatusBar />
      <View style={styles.content}>
        {checkingProfile ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 16, color: '#6B7280' }}>Checking your profile...</Text>
          </View>
        ) : existingProfile ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>You're already registered as {existingProfile.username}</Text>
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
          </View>
        ) : (
          <>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>Connect your wallet and choose a username to get started</Text>

            <View style={styles.section}>
              <Text style={styles.label}>Step 1: Connect Wallet</Text>
              {address ? (
                <View style={styles.connectedBox}>
                  <Text style={styles.connectedText}>✓ Connected</Text>
                  <Text style={styles.addressText}>{address.slice(0, 6)}...{address.slice(-4)}</Text>
                </View>
              ) : (
                <Button label="Connect Wallet" onPress={handleConnectWallet} />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Step 2: Choose Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <Button 
          label={loading ? 'Registering...' : 'Complete Registration'} 
          onPress={handleRegister}
          disabled={loading || !address || !username.trim()}
        />

        {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />}

        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>What you get:</Text>
          <Text style={styles.benefitItem}>• 10 NNT + 100 GNNT starter bonus</Text>
          <Text style={styles.benefitItem}>• Ability to create posts</Text>
          <Text style={styles.benefitItem}>• Vote on content</Text>
          <Text style={styles.benefitItem}>• Earn rewards for accurate voting</Text>
        </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  connectedBox: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
  },
  addressText: {
    fontSize: 14,
    color: '#059669',
    fontFamily: 'monospace',
  },
  loader: {
    marginTop: 20,
  },
  benefits: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: '#1E3A8A',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
