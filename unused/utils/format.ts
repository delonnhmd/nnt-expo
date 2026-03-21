import { ethers } from 'ethers';
export const formatUnits = (v?: any, d = 18) => (v == null ? '0' : ethers.formatUnits(v, d));
export const shortAddr = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '-');
