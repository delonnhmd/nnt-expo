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
  // Rewards info
  const [perAdNnt, setPerAdNnt] = useState<number | null>(null);
  // Optional claims countdown (if backend exposes it in /health)
  const [claimsEnabled, setClaimsEnabled] = useState<boolean | null>(null);
  const [claimStartAt, setClaimStartAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));

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
        // Rewards info for always-visible banner
        try {
          const r = await api.rewardsCurrent();
          const per = Number(r?.ad?.perAd?.nnt ?? r?.legacyAdPool?.perAdNNT ?? 0);
          setPerAdNnt(Number.isFinite(per) ? per : null);
        } catch {}
        // Optional claims flag if backend provides
        try {
          const h = await api.health();
          const ce = (h as any)?.claimsEnabled;
          const csa = Number((h as any)?.claimStartAt ?? 0);
          if (typeof ce === 'boolean') setClaimsEnabled(ce);
          if (Number.isFinite(csa) && csa > 0) setClaimStartAt(csa);
        } catch {}
        try {
          await refreshDebt();
        } catch {}
      } catch {}
    })();
  }, [address, refreshKey, refreshDebt]);

  // Tick countdown if needed
  useEffect(() => {
    if (!claimStartAt) return;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [claimStartAt]);

  const claimCountdown = (() => {
    if (!claimStartAt) return null;
    const delta = Math.max(0, claimStartAt - now);
    const h = Math.floor(delta / 3600);
    const m = Math.floor((delta % 3600) / 60);
    const s = delta % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  })();

  return (
    <View style={[styles.container, debt > 0 ? styles.containerDebt : undefined]}>
      <Text style={styles.text}>
        NNT: {nnt} • GNNT: {gnnt} • Ads left: {adsUidLeft ?? adsLeft}
      </Text>
      {perAdNnt !== null && (
        <Text style={styles.text}>Per ad: {perAdNnt.toFixed(2)} NNT</Text>
      )}
      {claimsEnabled === false && claimStartAt && claimCountdown && (
        <Text style={styles.text}>Claims in: {claimCountdown}</Text>
      )}
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
