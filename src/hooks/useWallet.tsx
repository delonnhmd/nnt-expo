import { CHAIN_ID, RPC_URL, WC_METADATA, WC_PROJECT_ID } from '@/constants';
import { log, recordError, recordInfo, recordWarning } from '@/lib/logger';
// eslint-disable-next-line import/no-named-as-default
import EthereumProvider from '@walletconnect/ethereum-provider';
import { ethers } from 'ethers';
import * as Linking from 'expo-linking';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// A single EIP-1193 provider instance kept across renders
let wcProvider: EthereumProvider | null = null;

// Keep last WalletConnect display URI at module level for retry flows.
let lastDisplayUri: string | undefined = undefined;

const WALLET_SCHEMES = [
  'metamask://',
  'trust://',
  'rainbow://',
  'argent://',
  'uniswap://',
  'wc://',
  'imtoken://',
  'bitkeep://',
  'oneinch://',
  'okx://',
  'safepal://',
  'tokenpocket://',
];

async function tryOpenWalletSchemes() {
  for (const scheme of WALLET_SCHEMES) {
    try {
      const opened = await Linking.canOpenURL(scheme);
      if (opened) {
        await Linking.openURL(scheme);
        return true;
      }
    } catch (error) {
      recordWarning('wallet', 'Failed to open wallet scheme.', {
        action: 'try_open_wallet_schemes',
        context: {
          scheme,
        },
        error,
      });
      // ignore and try next
    }
  }
  return false;
}

type WalletContextValue = {
  connected: boolean;
  address?: string;
  chainId?: number;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  ensureChain: () => Promise<boolean>;
  signMessage: (msg: string) => Promise<string>;
  provider: () => ethers.BrowserProvider | undefined;
  redirectUrl: string;
  openWallet: () => Promise<void>;
  getLastDisplayUri: () => string | undefined;
  debugOpenLastUri: () => Promise<boolean>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  const redirectUrl = useMemo(() => Linking.createURL('/'), []);

  const ensureProvider = useCallback(async () => {
    if (wcProvider) return wcProvider;
    if (!WC_PROJECT_ID) {
      const missingProjectError = new Error('Wallet connection is not available in this build.');
      recordError('wallet', 'Wallet connection project ID is missing.', {
        action: 'ensure_provider',
        error: missingProjectError,
      });
      throw missingProjectError;
    }
    if (!RPC_URL) {
      const missingRpcError = new Error('Wallet connection is not available in this build.');
      recordError('wallet', 'Wallet RPC URL is missing.', {
        action: 'ensure_provider',
        error: missingRpcError,
      });
      throw missingRpcError;
    }
    try {
      wcProvider = await EthereumProvider.init({
        projectId: WC_PROJECT_ID,
        showQrModal: false,
        metadata: WC_METADATA,
        rpcMap: { [CHAIN_ID]: RPC_URL },
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
      recordInfo('wallet', 'Wallet provider initialized.', {
        action: 'ensure_provider',
        context: {
          chainId: CHAIN_ID,
        },
      });
    } catch (error) {
      recordError('wallet', 'Wallet provider initialization failed.', {
        action: 'ensure_provider',
        context: {
          chainId: CHAIN_ID,
        },
        error,
      });
      throw error;
    }
    wcProvider.on('display_uri', (uri: string) => {
      try {
        lastDisplayUri = uri;
        log('WC', 'display_uri received');
        recordInfo('wallet', 'Wallet connection request received.', {
          action: 'display_uri',
          context: {
            hasUri: Boolean(uri),
          },
        });
        const mm = 'metamask://wc?uri=' + encodeURIComponent(uri);
        Linking.openURL(mm).catch(async (error) => {
          recordWarning('wallet', 'Primary wallet deep link failed.', {
            action: 'display_uri',
            error,
          });
          const schemes = [
            'rainbow://wc?uri=',
            'trust://wc?uri=',
            'argent://wc?uri=',
            'imtoken://wc?uri=',
            'wc://?uri=',
          ];
          for (const base of schemes) {
            try {
              const url = base + encodeURIComponent(uri);
              const can = await Linking.canOpenURL(url);
              if (can) {
                await Linking.openURL(url);
                return;
              }
            } catch (fallbackError) {
              recordWarning('wallet', 'Fallback wallet deep link failed.', {
                action: 'display_uri',
                error: fallbackError,
              });
              // ignore and try next
            }
          }
        });
      } catch (error) {
        recordWarning('wallet', 'WalletConnect URI handling failed.', {
          action: 'display_uri',
          error,
        });
        // ignore; best-effort
      }
    });
    wcProvider.on('accountsChanged', (accs: string[]) => {
      log('WC', 'accountsChanged', { accountCount: Array.isArray(accs) ? accs.length : 0 });
      recordInfo('wallet', 'Wallet accounts changed.', {
        action: 'accounts_changed',
        context: {
          connected: Boolean(accs?.[0]),
          accountCount: Array.isArray(accs) ? accs.length : 0,
        },
      });
      setAddress(accs?.[0]);
      setConnected(Boolean(accs?.[0]));
    });
    wcProvider.on('chainChanged', (cid: string) => {
      log('WC', 'chainChanged');
      const parsed = typeof cid === 'string' && cid.startsWith?.('0x') ? parseInt(cid, 16) : Number(cid);
      recordInfo('wallet', 'Wallet chain changed.', {
        action: 'chain_changed',
        context: {
          parsedChainId: Number.isFinite(parsed) ? parsed : null,
        },
      });
      setChainId(Number.isFinite(parsed) ? parsed : undefined);
    });
    wcProvider.on('disconnect', () => {
      log('WC', 'disconnect');
      recordInfo('wallet', 'Wallet disconnected.', {
        action: 'disconnect_event',
      });
      setConnected(false);
      setAddress(undefined);
      setChainId(undefined);
    });
    return wcProvider;
  }, []);

  const connect = useCallback(async () => {
    try {
      const p = await ensureProvider();
      await p.connect({ chains: [CHAIN_ID] });
      const accs = (await p.request({ method: 'eth_accounts' })) as string[];
      const net = (await p.request({ method: 'eth_chainId' })) as string;
      setAddress(accs?.[0]);
      const parsedNet = typeof net === 'string' && net.startsWith?.('0x') ? parseInt(net, 16) : Number(net);
      setChainId(Number.isFinite(parsedNet) ? parsedNet : undefined);
      setConnected(Boolean(accs?.[0]));
      log('WC', 'connected', {
        connected: Boolean(accs?.[0]),
        parsedChainId: Number.isFinite(parsedNet) ? parsedNet : null,
      });
      recordInfo('wallet', 'Wallet connected.', {
        action: 'connect',
        context: {
          connected: Boolean(accs?.[0]),
          parsedChainId: Number.isFinite(parsedNet) ? parsedNet : null,
        },
      });
    } catch (error) {
      recordError('wallet', 'Wallet connect failed.', {
        action: 'connect',
        error,
      });
      throw error;
    }
  }, [ensureProvider]);

  const ensureChain = useCallback(async () => {
    const p = await ensureProvider();
    try {
      const net = (await p.request({ method: 'eth_chainId' })) as string;
      const parsed = typeof net === 'string' && net.startsWith?.('0x') ? parseInt(net, 16) : Number(net);
      if (parsed === CHAIN_ID) return true;
    } catch (error) {
      recordWarning('wallet', 'Failed to read current wallet chain.', {
        action: 'ensure_chain',
        error,
      });
    }
    const targetHex = '0x' + CHAIN_ID.toString(16);
    try {
      await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: targetHex }] });
      setChainId(CHAIN_ID);
      recordInfo('wallet', 'Wallet chain switched.', {
        action: 'ensure_chain',
        context: {
          chainId: CHAIN_ID,
        },
      });
      return true;
    } catch (e: any) {
      const code = e?.code ?? e?.data?.originalError?.code;
      if (code === 4902 || String(e?.message || '').includes('Unrecognized chain ID')) {
        try {
          await p.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetHex,
              chainName: 'Sepolia Testnet',
              nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: RPC_URL ? [RPC_URL] : [],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            }],
          });
          setChainId(CHAIN_ID);
          recordInfo('wallet', 'Wallet chain added and selected.', {
            action: 'ensure_chain',
            context: {
              chainId: CHAIN_ID,
            },
          });
          return true;
        } catch (error) {
          recordWarning('wallet', 'Failed to add missing wallet chain.', {
            action: 'ensure_chain',
            error,
          });
          return false;
        }
      }
      recordWarning('wallet', 'Failed to switch wallet chain.', {
        action: 'ensure_chain',
        error: e,
      });
      return false;
    }
  }, [ensureProvider]);

  const disconnect = useCallback(async () => {
    if (!wcProvider) {
      setConnected(false);
      setAddress(undefined);
      setChainId(undefined);
      return;
    }
    try {
      await wcProvider.disconnect();
    } catch (error) {
      recordWarning('wallet', 'Wallet disconnect request failed.', {
        action: 'disconnect',
        error,
      });
      /* noop */
    }
    setConnected(false);
    setAddress(undefined);
    setChainId(undefined);
  }, []);

  const openWallet = useCallback(async () => {
    try {
      if (lastDisplayUri) {
        const uri = lastDisplayUri;
        const tryOrder = [
          'metamask://wc?uri=',
          'rainbow://wc?uri=',
          'trust://wc?uri=',
          'wc://?uri=',
        ];
        for (const base of tryOrder) {
          const url = base + encodeURIComponent(uri);
          try {
            const can = await Linking.canOpenURL(url);
            if (can) {
              await Linking.openURL(url);
              return;
            }
          } catch {
            // ignore and try next
          }
        }
      }

      const opened = await tryOpenWalletSchemes();
      if (!opened) {
        recordWarning('wallet', 'No wallet app responded to known schemes.', {
          action: 'open_wallet',
        });
        await Linking.openURL(redirectUrl).catch((error) => {
          recordWarning('wallet', 'Fallback redirect failed while opening wallet.', {
            action: 'open_wallet',
            error,
          });
        });
      }
    } catch (error) {
      recordWarning('wallet', 'Open wallet flow failed.', {
        action: 'open_wallet',
        error,
      });
      // swallow errors; this is best-effort
    }
  }, [redirectUrl]);

  const getLastDisplayUri = useCallback(() => lastDisplayUri, []);
  const debugOpenLastUri = useCallback(async () => {
    if (!lastDisplayUri) throw new Error('Wallet connection request is not available.');
    const uri = lastDisplayUri;
    const tryOrder = [
      'metamask://wc?uri=',
      'rainbow://wc?uri=',
      'trust://wc?uri=',
      'wc://?uri=',
    ];
    for (const base of tryOrder) {
      const url = base + encodeURIComponent(uri);
      try {
        const can = await Linking.canOpenURL(url);
        if (can) {
          await Linking.openURL(url);
          return true;
        }
      } catch {
        // ignore
      }
    }
    return false;
  }, []);

  const signMessage = useCallback(async (msg: string) => {
    const p = await ensureProvider();
    if (!address) throw new Error('No wallet connected');

    try {
      const sig = (await p.request({
        method: 'personal_sign',
        params: [msg, address],
      })) as string;
      return sig;
    } catch (err1) {
      log('WC', 'personal_sign failed plain', err1);
    }

    const msgHex = '0x' + Buffer.from(msg, 'utf8').toString('hex');

    try {
      const sig2 = (await p.request({
        method: 'personal_sign',
        params: [msgHex, address],
      })) as string;
      return sig2;
    } catch (err2) {
      log('WC', 'personal_sign failed hex-1', err2);
    }

    try {
      const sig3 = (await p.request({
        method: 'personal_sign',
        params: [address, msgHex],
      })) as string;
      return sig3;
    } catch (err3) {
      log('WC', 'personal_sign failed hex-2', err3);
    }

    const signError = new Error('personal_sign failed (all attempts)');
    recordError('wallet', 'Wallet message signing failed.', {
      action: 'sign_message',
      context: {
        hasMessage: Boolean(msg),
      },
      error: signError,
    });
    throw signError;
  }, [address, ensureProvider]);

  const signerProvider = useCallback(() => {
    if (!wcProvider) return undefined;
    return new ethers.BrowserProvider(wcProvider as any, 'any');
  }, []);

  const value = useMemo<WalletContextValue>(() => ({
    connected,
    address,
    chainId,
    connect,
    disconnect,
    ensureChain,
    signMessage,
    provider: signerProvider,
    redirectUrl,
    openWallet,
    getLastDisplayUri,
    debugOpenLastUri,
  }), [connected, address, chainId, connect, disconnect, ensureChain, signMessage, signerProvider, redirectUrl, openWallet, getLastDisplayUri, debugOpenLastUri]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}

/**
 * WalletConnectUI
 * Keep this mounted once so wallet deep links can be handled.
 */
export function WalletConnectUI() { return null; }
