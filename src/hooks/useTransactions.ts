import { useCallback, useState } from 'react';
import { useWallet } from './useWallet';
import { useBackend } from './useBackend';

export interface TransactionData {
  to: string;
  data: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  chainId: number;
}

export function useTransactions() {
  const { provider, address, ensureChain } = useWallet();
  const backend = useBackend();
  const [loading, setLoading] = useState(false);

  const executeTransaction = useCallback(async (txData: TransactionData) => {
    if (!address) throw new Error('Wallet not connected');
    // Ensure chain first for better UX
    try { await (ensureChain?.() as any); } catch {}
    const ethersProvider = provider();
    if (!ethersProvider) throw new Error('Provider not available');
    
    setLoading(true);
    try {
      const signer = await ethersProvider.getSigner();
      
      // Send the transaction using ethers signer
      const result = await signer.sendTransaction({
        to: txData.to,
        data: txData.data,
        value: txData.value || '0x0',
        gasLimit: txData.gas,
        gasPrice: txData.gasPrice,
      });
      
      return result;
    } finally {
      setLoading(false);
    }
  }, [address, provider]);

  // Claim TRUE rewards
  const claimTrue = useCallback(async (postId: number) => {
    if (!address) throw new Error('Wallet not connected');
    // In points mode, claims are not on-chain
    if (await backend.isPointsMode()) {
      // no-op or could award bonus points; return a fake tx-like object
      return { hash: '0x-offchain-claim' } as any;
    }
    const txData = await backend.claimTrue(address, postId);
    return await executeTransaction(txData);
  }, [address, backend, executeTransaction]);

  // Pay gap fee
  const payGap = useCallback(async (postId: number) => {
    if (!address) throw new Error('Wallet not connected');
    if (await backend.isPointsMode()) {
      return { hash: '0x-offchain-gap' } as any;
    }
    const txData = await backend.payGap(address, postId);
    return await executeTransaction(txData);
  }, [address, backend, executeTransaction]);

  // Vote TRUE on post
  const voteTrue = useCallback(async (postId: number) => {
    if (!address) throw new Error('Wallet not connected');
    if (await backend.isPointsMode()) {
      await backend.offchainVote(address, postId, 101);
      return { hash: '0x-offchain-vote-true' } as any;
    }
    const txData = await backend.voteTrueOnPost(address, postId);
    return await executeTransaction(txData);
  }, [address, backend, executeTransaction]);

  // Vote FAKE on post
  const voteFake = useCallback(async (postId: number) => {
    if (!address) throw new Error('Wallet not connected');
    if (await backend.isPointsMode()) {
      await backend.offchainVote(address, postId, 102);
      return { hash: '0x-offchain-vote-fake' } as any;
    }
    const txData = await backend.voteFakeOnPost(address, postId);
    return await executeTransaction(txData);
  }, [address, backend, executeTransaction]);

  // Register view on post
  const viewPost = useCallback(async (postId: number) => {
    if (!address) throw new Error('Wallet not connected');
    if (await backend.isPointsMode()) {
      await backend.offchainView(address, postId);
      return { hash: '0x-offchain-view' } as any;
    }
    const txData = await backend.registerView(address, postId);
    return await executeTransaction(txData);
  }, [address, backend, executeTransaction]);

  // Create post with deposit
  const createPost = useCallback(async (postId: number) => {
    if (!address) throw new Error('Wallet not connected');
    if (await backend.isPointsMode()) {
      await backend.offchainCreate(address, postId);
      return { hash: '0x-offchain-create' } as any;
    }
    const txData = await backend.createPostTx(address, postId);
    return await executeTransaction(txData);
  }, [address, backend, executeTransaction]);

  return {
    loading,
    claimTrue,
    payGap,
    voteTrue,
    voteFake,
    viewPost,
    createPost,
    executeTransaction,
  } as const;
}