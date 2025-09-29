import { CHAIN_ID, RPC_URL, WC_METADATA, WC_PROJECT_ID } from '@/constants';
import { log } from '@/lib/logger';
import EthereumProvider from '@walletconnect/ethereum-provider';
import { ethers } from 'ethers';
import * as Linking from 'expo-linking';
import { useMemo, useState } from 'react';

// A single EIP-1193 provider instance kept across renders
let wcProvider: EthereumProvider | null = null;

export function useWallet() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  const redirectUrl = useMemo(() => Linking.createURL('/'), []);

  // initialize provider once
  async function ensureProvider() {
    if (wcProvider) return wcProvider;
    if (!WC_PROJECT_ID) throw new Error('Missing EXPO_PUBLIC_WC_PROJECT_ID');
    wcProvider = await EthereumProvider.init({
      projectId: WC_PROJECT_ID,
      showQrModal: false, // we use native wallet apps
      metadata: WC_METADATA,
      rpc: { [CHAIN_ID]: RPC_URL },
      methods: [
        'eth_sendTransaction',
        'eth_sign',
        'personal_sign',
        'eth_signTypedData',
        'eth_signTypedData_v4',
        'wallet_switchEthereumChain',
        'wallet_addEthereumChain',
      ],
      events: ['chainChanged', 'accountsChanged'],
      chains: [CHAIN_ID],
      optionalChains: [CHAIN_ID],
    });
    // Forward the wc deep link to wallet
    wcProvider.on('display_uri', (uri: string) => {
      const link = `wc:${uri.split('wc:').pop()}`;
      log('WC', 'display_uri', link);
      Linking.openURL(link).catch(() => {});
    });
    wcProvider.on('accountsChanged', (accs: string[]) => {
      log('WC', 'accountsChanged', accs);
      setAddress(accs?.[0]);
    });
    wcProvider.on('chainChanged', (cid: number) => {
      log('WC', 'chainChanged', cid);
      setChainId(Number(cid));
    });
    wcProvider.on('disconnect', () => {
      log('WC', 'disconnect');
      setConnected(false); setAddress(undefined); setChainId(undefined);
    });
    return wcProvider;
  }

  async function connect() {
    const p = await ensureProvider();
    await p.connect({ chains: [CHAIN_ID] });
    const accs = (await p.request({ method: 'eth_accounts' })) as string[];
    const net = (await p.request({ method: 'eth_chainId' })) as string;
    setAddress(accs?.[0]);
    setChainId(Number(net));
    setConnected(true);
    log('WC', 'connected', { accs, net });
  }

  async function disconnect() {
    if (!wcProvider) return;
    try { await wcProvider.disconnect(); } catch { /* noop */ }
    setConnected(false); setAddress(undefined); setChainId(undefined);
  }

  async function signMessage(msg: string) {
    const p = await ensureProvider();
    if (!address) throw new Error('No wallet connected');
    const sig = await p.request({
      method: 'personal_sign',
      params: [msg, address],
    }) as string;
    return sig;
  }

  // ethers BrowserProvider for reads that require signer (not needed for balance read)
  const signerProvider = useMemo(() => {
    if (!wcProvider) return undefined;
    // ethers v6 Eip1193Provider -> BrowserProvider
    return new ethers.BrowserProvider(wcProvider as any, 'any');
  }, [connected, address, chainId]);

  return { connected, address, chainId, connect, disconnect, signMessage, provider: signerProvider, redirectUrl };
}

/**
 * WalletConnectUI
 * Keep this mounted (usually once at the root screen) so deep links work.
 * We use the SDK without the React Modal, so this is a no-op placeholder.
 * If you later switch to @walletconnect/modal-react-native, mount it here.
 */
export function WalletConnectUI() { return null; }
