import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useBackend } from '@/hooks/useBackend';

export type DebtEntry = {
  postId?: number | string;
  due: number;
  voters: number;
};

export type DebtSnapshot = {
  outstanding: number;
  pendingTotal: number;
  entries: DebtEntry[];
};

type DebtContextValue = DebtSnapshot & {
  loading: boolean;
  error: string | null;
  lastUpdated?: number;
  refresh: () => Promise<DebtSnapshot>;
  setOutstanding: (value: number) => void;
};

const INITIAL_SNAPSHOT: DebtSnapshot = {
  outstanding: 0,
  pendingTotal: 0,
  entries: [],
};

const DebtContext = createContext<DebtContextValue | undefined>(undefined);

export function DebtProvider({ children }: { children: React.ReactNode }) {
  const { address } = useWallet();
  const backend = useBackend();
  const addressRef = useRef<string | undefined>(address);
  const [snapshot, setSnapshot] = useState<DebtSnapshot>(INITIAL_SNAPSHOT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined);

  useEffect(() => {
    addressRef.current = address || undefined;
  }, [address]);

  const reset = useCallback(() => {
    setSnapshot(INITIAL_SNAPSHOT);
    setError(null);
    setLastUpdated(undefined);
  }, []);

  const refresh = useCallback(async (): Promise<DebtSnapshot> => {
    const target = addressRef.current;
    if (!target) {
      reset();
      return INITIAL_SNAPSHOT;
    }
    setLoading(true);
    try {
      const data = await backend.getDebt(target);
      const entries = Array.isArray(data?.pendingReceivables?.entries)
        ? data.pendingReceivables.entries.map((e: any) => ({
            postId: e?.postId,
            due: Number(e?.due ?? 0),
            voters: Number(e?.voters ?? 0),
          }))
        : [];
      const next: DebtSnapshot = {
        outstanding: Number(data?.outstanding ?? 0),
        pendingTotal: Number(data?.pendingReceivables?.total ?? 0),
        entries,
      };
      setSnapshot(next);
      setError(null);
      setLastUpdated(Date.now());
      return next;
    } catch (err: any) {
      const message = err?.message || String(err);
      setError(message);
      return snapshot;
    } finally {
      setLoading(false);
    }
  }, [backend, reset, snapshot]);

  useEffect(() => {
    if (!address) {
      reset();
      return;
    }
    refresh();
  }, [address, refresh, reset]);

  const setOutstanding = useCallback((value: number) => {
    setSnapshot((prev) => ({ ...prev, outstanding: value }));
  }, []);

  const value = useMemo<DebtContextValue>(
    () => ({
      ...snapshot,
      loading,
      error,
      lastUpdated,
      refresh,
      setOutstanding,
    }),
    [snapshot, loading, error, lastUpdated, refresh, setOutstanding]
  );

  return <DebtContext.Provider value={value}>{children}</DebtContext.Provider>;
}

export function useDebt() {
  const ctx = useContext(DebtContext);
  if (!ctx) throw new Error('useDebt must be used inside DebtProvider');
  return ctx;
}
