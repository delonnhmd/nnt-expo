// pft-expo/app/_layout.tsx
import '@walletconnect/react-native-compat'; // MUST be first — ensures native shims are registered
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Slot, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import DiagnosticsErrorBoundary from '@/components/ui/DiagnosticsErrorBoundary';
import { BACKEND, RPC_URL, WC_PROJECT_ID } from '@/constants';
import { WalletProvider } from '@/hooks/useWallet';
import { DebtProvider } from '@/hooks/useDebt';
import { recordInfo, recordWarning } from '@/lib/logger';

export default function Layout() {
  useEffect(() => {
    recordInfo('app.startup', 'Root layout mounted.', {
      action: 'mount',
      context: {
        hasBackend: Boolean(BACKEND),
        hasRpcUrl: Boolean(RPC_URL),
        hasWalletProjectId: Boolean(WC_PROJECT_ID),
      },
    });

    if (!BACKEND || !RPC_URL || !WC_PROJECT_ID) {
      recordWarning('app.startup', 'Public runtime configuration is incomplete.', {
        action: 'config_check',
        context: {
          hasBackend: Boolean(BACKEND),
          hasRpcUrl: Boolean(RPC_URL),
          hasWalletProjectId: Boolean(WC_PROJECT_ID),
        },
      });
    }
  }, []);

  return (
    <DiagnosticsErrorBoundary>
      <WalletProvider>
        <DebtProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Slot />
          </Stack>
          <StatusBar style="auto" />
        </DebtProvider>
      </WalletProvider>
    </DiagnosticsErrorBoundary>
  );
}
