// nnt-expo/app/_layout.tsx
import '@walletconnect/react-native-compat'; // MUST be first — ensures native shims are registered
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Slot, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WalletProvider } from '@/hooks/useWallet';
import { DebtProvider } from '@/hooks/useDebt';

export default function Layout() {
  return (
    <WalletProvider>
      <DebtProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Slot />
        </Stack>
        <StatusBar style="auto" />
      </DebtProvider>
    </WalletProvider>
  );
}
