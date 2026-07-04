"use client";

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from '@/lib/chain/wagmi-config';
import { CHAIN } from '@/lib/chain/config';
import { useState } from 'react';
import { TransactionOverlay } from '@/components/app/transaction-overlay';

// Custom Blitz dark theme for RainbowKit
const blitzTheme = darkTheme({
  accentColor: '#836EF9',
  accentColorForeground: '#F4F4F5',
  borderRadius: 'small',
  overlayBlur: 'small',
});

// Override modal backgrounds to match Blitz tokens
blitzTheme.colors.modalBackground = '#101015';
blitzTheme.colors.profileForeground = '#101015';
blitzTheme.colors.connectButtonBackground = '#101015';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient in state to avoid shared instance across requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Monad has 400ms blocks - poll aggressively for live feel
            refetchInterval: 500,
            staleTime: 400,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={blitzTheme} initialChain={CHAIN}>
            <TransactionOverlay />
            {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
