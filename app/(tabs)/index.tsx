// app/(tabs)/index.tsx
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { WalletConnectModal, useWalletConnectModal } from '@walletconnect/modal-react-native';
import { ethers } from 'ethers';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Platform, SafeAreaView, ScrollView, Share, Text, TextInput, View } from 'react-native';

// ========= CONFIG: edit these =========
const BACKEND = 'http://192.168.1.23:8082/';        // phone-reachable URL (or https://your-domain/)
const WC_PROJECT_ID = '417afd8ed814b70b208a864375affdef';
const CHAIN_ID  = 11155111;                         // Sepolia
const CHAIN_HEX = '0xaa36a7';
const RPC_URL   = 'https://eth-sepolia.g.alchemy.com/v2/_3_-olRoOtcB_dXWsogSb';
// =====================================
const redirectUrl: string = Linking.createURL('/');

const WC_METADATA = {
  name: 'NNT — Sepolia Test Hub',
  description: 'NNT/GNNT mobile connector',
  url: 'https://nnt.example',        // can be placeholder while testing
  icons: ['https://nnt.example/icon.png'],
};

const abs = (p: string) => `${BACKEND.replace(/\/+$/,'')}/${p.replace(/^\/+/,'')}`;
async function j(path: string, method: 'GET'|'POST'='GET', body?: any) {
  const r = await fetch(abs(path), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let json: any; try { json = JSON.parse(t); } catch { json = { raw: t }; }
  if (!r.ok) throw new Error(json.error || t || 'request failed');
  return json;
}

export default function Home() {
  const [log, setLog] = useState('');
  const [postId, setPostId] = useState('1001');
  const [topic, setTopic] = useState('General');
  const [content, setContent] = useState('Hello NNT!');
  const [streak, setStreak] = useState(1);
  const [chain, setChain] = useState<string>('');

  const append = (s: string) => setLog(p => s + '\n' + p);

  // WalletConnect (native)
  const { open, close, isConnected, provider, address } = useWalletConnectModal();

  const browserProvider = useMemo(() => {
    if (!isConnected || !provider) return null;
    return new ethers.BrowserProvider(provider as any, CHAIN_ID);
  }, [isConnected, provider]);

  // Keep chain state in sync
  useEffect(() => {
    if (!provider) return;

    // read current chain id
    (async () => {
      try {
        const cid = await (provider as any).request?.({ method: 'eth_chainId' });
        if (cid) setChain(String(cid));
      } catch {}
    })();

    const onChainChanged = (cid: any) => setChain(String(cid));
    (provider as any).on?.('chainChanged', onChainChanged);
    return () => (provider as any).off?.('chainChanged', onChainChanged);
  }, [provider]);

  const ensure = () => {
    if (!isConnected || !address) { Alert.alert('Connect a wallet first'); return false; }
    return true;
  };

  const onConnect = async () => {
    try {
      await open(); // opens native WC modal
      // after modal resolves, read chain id
      const cid = await (provider as any)?.request?.({ method: 'eth_chainId' });
      if (cid) setChain(String(cid));
      append(`Connected: ${address} on ${cid ?? '(unknown chain)'}`);

      // try ensure Sepolia (wallets may ignore in RN modal; harmless if unsupported)
      try {
        await (provider as any).request?.({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CHAIN_HEX }],
        });
      } catch {}
    } catch (e: any) {
      append(`connect error: ${String(e?.message || e)}`);
    }
  };

  const onDisconnect = async () => {
    try { await close(); } catch {}
  };

  const onRegister = async () => {
    if (!ensure() || !browserProvider) return;
    try {
      const { nonce } = await j(`/auth/nonce?address=${address}`);
      const signer = await browserProvider.getSigner();
      const sig = await signer.signMessage(nonce);
      const res = await j('/auth/verify', 'POST', { address, signature: sig });
      append(`Registered: ${JSON.stringify(res)}`);
    } catch (e: any) {
      append(`register error: ${String(e?.message || e)}`);
    }
  };

  const sendPrepared = async (path: string, body: any) => {
    if (!ensure() || !browserProvider) return;
    const prep = await j(path, 'POST', body);
    const signer = await browserProvider.getSigner();
    const tx = await signer.sendTransaction(prep);
    const rc = await tx.wait();
    append(`${path} → ${rc?.hash || '(mined)'}`);
  };

  // Actions
  const onCreatePost   = () => sendPrepared('/tx/post/create',   { from: address, postId: parseInt(postId) });
  const onVoteTrue     = () => sendPrepared('/tx/vote',           { from: address, postId: parseInt(postId), sideTrue: true });
  const onVoteFake     = () => sendPrepared('/tx/vote',           { from: address, postId: parseInt(postId), sideTrue: false });
  const onRegisterView = () => sendPrepared('/tx/view/register',  { from: address, postId: parseInt(postId) });
  const onClaimTrue    = () => sendPrepared('/tx/claim/true',     { from: address, postId: parseInt(postId) });
  const onPayGap       = () => sendPrepared('/tx/gap/pay',        { from: address, postId: parseInt(postId) });

  const onAdWatch = async () => {
    if (!ensure()) return;
    const r = await j('/ad/view', 'POST', { viewer: address });
    append(`ad reward: ${JSON.stringify(r)}`);
  };

  const onAirdrop = async (token: 'nnt'|'gnnt', epoch: number) => {
    if (!ensure()) return;
    try {
      const cl = await j(`/airdrop/claimable?token=${token}&epoch=${epoch}&address=${address}`);
      append(`claimable ${token}@${epoch}: ${JSON.stringify(cl)}`);
    } catch {}
    const r = await j('/airdrop/claim-server', 'POST', { token, epoch, address });
    append(`airdrop ${token}@${epoch}: ${JSON.stringify(r)}`);
  };

  const onInspect  = async () => { const r = await j(`/post/${parseInt(postId)}/state`); append(`inspect: ${JSON.stringify(r)}`); };
  const onBalance  = async (t:'nnt'|'gnnt') => { const r = await j(`/balance?token=${t}&address=${address}`); append(`${t} balance: ${JSON.stringify(r)}`); };
  const onReferral = async () => {
    if (!ensure()) return;
    const r = await j(`/ref/link?address=${address}`);
    append(`referral: ${r.link}`); try { await Share.share({ message: `Join me on NNT: ${r.link}` }); } catch {}
  };

  const Quest = () => (
    <View style={{ flexDirection: 'row', marginVertical: 6 }}>
      {[1,2,3,4,5,6,7].map(i => (
        <View key={i} style={{
          flex:1, height:10, marginHorizontal:2, borderRadius:4,
          backgroundColor: i<=streak ? '#4ade80' : '#e5e7eb'
        }} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, padding: 14 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>NNT/GNNT — Sepolia Test Hub</Text>
      <Text selectable>Backend: {BACKEND}</Text>
      <Text selectable>RPC: {RPC_URL}</Text>

      {/* WalletConnect Native Modal */}
      <WalletConnectModal
       projectId={WC_PROJECT_ID}
  // @ts-ignore: providerMetadata typing mismatch in some wallets - runtime is fine
  providerMetadata={WC_METADATA as any}
  sessionParams={{
    namespaces: {
      eip155: {
        chains: [`eip155:${CHAIN_ID}`],
        methods: [
          'eth_sendTransaction', 'eth_sign', 'personal_sign',
          'eth_signTypedData', 'eth_signTypedData_v4',
          'wallet_switchEthereumChain', 'wallet_addEthereumChain',
        ],
        events: ['accountsChanged', 'chainChanged'],
        rpcMap: {
          [`eip155:${CHAIN_ID}`]: RPC_URL,
        },
      },
    },
  }}
  // cast to string to silence a TS prop signature mismatch in dev
  redirectUrl={redirectUrl}
  themeMode="dark"
/>

      <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button title={isConnected ? 'Connected' : 'Connect Wallet'} onPress={onConnect} />
        <Button title="Disconnect" onPress={onDisconnect} />
        <Button title="Register" onPress={onRegister} />
      </View>
      <Text style={{ marginTop: 6 }} selectable>Account: {address || '(not connected)'}</Text>
      <Text>Chain: {chain || '-'}</Text>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '600' }}>7-day Quest</Text>
        <Quest />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="Mark Today Done" onPress={() => setStreak(s => Math.min(7, s+1))} />
          <Button title="Reset" onPress={() => setStreak(1)} />
        </View>
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={{ fontWeight: '600' }}>Post Composer</Text>
        <TextInput placeholder="Post ID" value={postId} onChangeText={setPostId}
          keyboardType="numeric" style={{ borderWidth:1, borderRadius:8, padding:10, marginTop:6 }} />
        <TextInput placeholder="Topic" value={topic} onChangeText={setTopic}
          style={{ borderWidth:1, borderRadius:8, padding:10, marginTop:6 }} />
        <TextInput placeholder="Content" value={content} onChangeText={setContent}
          style={{ borderWidth:1, borderRadius:8, padding:10, marginTop:6 }} />
        <View style={{ flexDirection:'row', flexWrap:'wrap', rowGap:8, columnGap:8, marginTop:8 }}>
          <Button title="Create Post" onPress={onCreatePost} />
          <Button title="Vote TRUE" onPress={onVoteTrue} />
          <Button title="Vote FAKE" onPress={onVoteFake} />
          <Button title="Register View" onPress={onRegisterView} />
          <Button title="Ad: Watch Reward" onPress={onAdWatch} />
        </View>
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={{ fontWeight: '600' }}>Claims & Balances</Text>
        <View style={{ flexDirection:'row', flexWrap:'wrap', rowGap:8, columnGap:8, marginTop:6 }}>
          <Button title="Claim TRUE (GNNT)" onPress={onClaimTrue} />
          <Button title="Pay Gap (NNT)" onPress={onPayGap} />
          <Button title="Airdrop NNT (100)" onPress={() => onAirdrop('nnt', 100)} />
          <Button title="Airdrop NNT (101)" onPress={() => onAirdrop('nnt', 101)} />
          <Button title="Airdrop GNNT (200)" onPress={() => onAirdrop('gnnt', 200)} />
          <Button title="NNT Balance" onPress={() => onBalance('nnt')} />
          <Button title="GNNT Balance" onPress={() => onBalance('gnnt')} />
        </View>
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={{ fontWeight: '600' }}>Inspector & Referral</Text>
        <View style={{ flexDirection:'row', gap:8, marginTop:6 }}>
          <Button title="Inspect Post" onPress={onInspect} />
          <Button title="Referral / Share" onPress={onReferral} />
        </View>
      </View>

      <Text style={{ marginTop: 10, fontWeight: '700' }}>Log</Text>
      <ScrollView style={{ flex:1, borderWidth:1, borderRadius:8, marginTop:6, padding:8 }}>
        <Text selectable style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
          {log || '(no logs yet)'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
