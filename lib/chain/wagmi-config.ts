"use client";

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { monadTestnet } from 'viem/chains';
import { http } from 'wagmi';
import { MONAD_TESTNET_RPC } from '@/lib/chain/config';

export const wagmiConfig = getDefaultConfig({
  appName: 'Blitz',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'demo_project_id',
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(MONAD_TESTNET_RPC),
  },
  ssr: true,
  multiInjectedProviderDiscovery: false,
});
