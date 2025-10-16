import { useCallback, useState } from 'react';
import { useBackend } from './useBackend';

async function json(baseUrl: string, path: string, init?: RequestInit) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
  const txt = await res.text();
  const j = txt ? JSON.parse(txt) : null;
  if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
  return j;
}

export function useAds() {
  const backend = useBackend();
  const [loading, setLoading] = useState(false);
  const [lastCallTime, setLastCallTime] = useState(0);

  // Use the /ad/view endpoint that exists in your backend
  const watchOnce = useCallback(async (address?: string) => {
    // Prevent rapid successive calls (min 2 seconds between calls)
    const now = Date.now();
    if (now - lastCallTime < 2000) {
      console.log('Ad watch rate limited - please wait');
      return { ok: false, error: 'rate_limited' };
    }

    setLoading(true);
    setLastCallTime(now);
    try {
      if (!address) throw new Error('address required for /ad/view');
      
  console.log('Calling /ad/view for address:', address, 'backend:', backend.backendUrl);
      // Call the legacy single-call endpoint that exists in backend.py
      const result = await json(backend.backendUrl, '/ad/view', { 
        method: 'POST', 
        body: JSON.stringify({ viewer: address }) 
      });
      
      console.log('Ad view response:', result);
      return { ok: true, result };
    } catch (error) {
      console.error('Ad view error:', error);
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    } finally {
      setLoading(false);
    }
  }, [lastCallTime, backend.backendUrl]);

  return { loading, watchOnce } as const;
}
