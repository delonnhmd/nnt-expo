// Future-only wallet-auth registration hook.
// No active gameplay route should depend on this handshake to function.
import { error, log } from '@/lib/logger';
import { useState } from 'react';
import { useBackend } from './useBackend';
import { useWallet } from './useWallet';

type Opts = {
  address?: string;
  signMessage: (msg: string) => Promise<string>;
};

export function useRegistration({ address, signMessage }: Opts) {
  const { getNonce, verify } = useBackend();
  const { openWallet } = useWallet();

  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'nonce' | 'signing' | 'verifying' | 'done' | 'error'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  const register = async () => {
    if (!address) { setLastError('No address'); return; }
    try {
      setLoading(true); setLastError(null); setStatus('nonce');
      const { nonce } = await getNonce(address);
      setStatus('signing');

      // Foreground the wallet app so the signature prompt is visible.
      try { await openWallet(); } catch { /* best-effort */ }

      const signature = await signMessage(nonce);
      setStatus('verifying');
      await verify({ address, signature });
      log('REG', 'verification complete');
      setRegistered(true);
      setStatus('done');
    } catch (e: any) {
      error('REG', e?.message || e);
      setLastError(e?.message || String(e));
      setStatus('error');
    } finally { setLoading(false); }
  };

  return { register, registered, loading, status, lastError };
}