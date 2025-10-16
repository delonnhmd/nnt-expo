import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getApi } from '@/lib/api';
import { useWallet } from '@/hooks/useWallet';
import { useDebt } from '@/hooks/useDebt';

export default function TopStatusBar({ refreshKey = 0 }: { refreshKey?: number }) {
  const { address } = useWallet();
  const [nnt, setNnt] = useState<number>(0);
  const [gnnt, setGnnt] = useState<number>(0);
  // Prefer identity-based ads from /me/balance; fallback to address-based ad credits
  const [adsLeft, setAdsLeft] = useState<number>(0);
  const [adsUidLeft, setAdsUidLeft] = useState<number | null>(null);
  const { outstanding: debt, refresh: refreshDebt } = useDebt();

  useEffect(() => {
    (async () => {
      try {
        const api = await getApi();
        const pts = await api.getPoints(address ?? '0x0');
        // Identity-based
        try {
          const me = await api.meBalance();
          const left = (me?.ads?.cap ?? 0) - (me?.ads?.used ?? 0);
          setAdsUidLeft(left);
        } catch {}
        // Address-based (legacy)
        const ads = await api.adCredits(address ?? '0x0');
        setNnt(pts.nnt);
        setGnnt(pts.gnnt);
        setAdsLeft(ads.remaining);
        try {
          await refreshDebt();
        } catch {}
      } catch {}
    })();
  }, [address, refreshKey, refreshDebt]);

  return (
    <View style={[styles.container, debt > 0 ? styles.containerDebt : undefined]}>
      <Text style={styles.text}>
        NNT: {nnt} • GNNT: {gnnt} • Ads left: {adsUidLeft ?? adsLeft}
      </Text>
      {debt > 0 && (
        <Text style={styles.debt}>
          🔒 Debt: {debt} NNT — posting & voting locked until repaid
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#111',
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  debt: {
    color: '#ff9e9e',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 2,
  },
  containerDebt: {
    backgroundColor: '#3b0000',
  },
});
