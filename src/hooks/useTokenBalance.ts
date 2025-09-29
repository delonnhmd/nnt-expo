import { RPC_URL } from '@/constants';
import { error } from '@/lib/logger';
import { formatUnits } from '@/utils/format';
import { ethers } from 'ethers';
import { useEffect, useMemo, useState } from 'react';

// minimal ERC-20 ABI
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

type Opts = {
  token?: string;            // if omitted, read native ETH
  address?: string;
  decimals?: number;         // optional override; if not provided we try to read from contract
  pollMs?: number;           // optional polling
};

export function useTokenBalance({ token, address, decimals, pollMs }: Opts) {
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState<bigint | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const publicProvider = useMemo(() => new ethers.JsonRpcProvider(RPC_URL), []);

  async function readOnce() {
    if (!address) return;
    try {
      setLoading(true);
      setLastError(null);
      if (!token) {
        const v = await publicProvider.getBalance(address);
        setRaw(v);
      } else {
        const erc20 = new ethers.Contract(token, ERC20_ABI, publicProvider);
        const v: bigint = await erc20.balanceOf(address);
        setRaw(v);
      }
    } catch (e: any) {
      error('BAL', e?.message || e);
      setLastError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { readOnce(); }, [address, token]);

  useEffect(() => {
    if (!pollMs) return;
    const t = setInterval(() => { readOnce(); }, pollMs);
    return () => clearInterval(t);
  }, [pollMs, address, token]);

  const formatted = useMemo(() => {
    if (raw == null) return '0';
    return formatUnits(raw, decimals ?? 18);
  }, [raw, decimals]);

  return { raw, formatted, loading, refresh: readOnce, lastError };
}
