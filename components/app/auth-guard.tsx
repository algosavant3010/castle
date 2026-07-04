"use client";

import { useAccount } from "wagmi";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, Suspense } from "react";
import { MONAD_TESTNET_ID } from "@/lib/chain/config";
import { Topbar } from "@/components/app/topbar";
import { PageTransition } from "@/components/app/page-transition";
import { PageLoading } from "@/components/app/page-loading";
import { CastleLoader } from "@/components/app/castle-loader";
import SideRays from "@/components/reactbits/backgrounds/SideRays";

/**
 * Auth Guard - gates the app behind wallet connection.
 * Redirects to /connect if disconnected.
 * Renders the app shell: background + topbar + content.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting, isReconnecting, chain } = useAccount();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/connect") return;
    if (isConnecting || isReconnecting) return;
    if (!isConnected) {
      router.push("/connect");
    }
  }, [isConnected, isConnecting, isReconnecting, pathname, router]);

  // Connect page renders without shell chrome
  if (pathname === "/connect") {
    return <>{children}</>;
  }

  // Loading state (includes reconnecting to avoid flash)
  if (isConnecting || isReconnecting || !isConnected) {
    return (
      <>
        <div className="fixed inset-0 z-0" aria-hidden="true">
          <SideRays
            speed={1.5}
            rayColor1="#5227FF"
            rayColor2="#836EF9"
            intensity={1.5}
            spread={2}
            origin="top-right"
            tilt={0}
            saturation={1.2}
            blend={0.6}
            falloff={1.8}
            opacity={0.6}
          />
        </div>
        <div className="relative z-10 flex h-screen items-center justify-center">
          <CastleLoader />
        </div>
      </>
    );
  }

  // Wrong network
  if (chain && chain.id !== MONAD_TESTNET_ID) {
    return (
      <>
        <div className="fixed inset-0 z-0" aria-hidden="true">
          <SideRays
            speed={1.5}
            rayColor1="#5227FF"
            rayColor2="#836EF9"
            intensity={1.5}
            spread={2}
            origin="top-right"
            tilt={0}
            saturation={1.2}
            blend={0.6}
            falloff={1.8}
            opacity={0.6}
          />
        </div>
        <div className="relative z-10 flex h-screen flex-col items-center justify-center gap-4 px-6">
          <div className="glass-strong p-8 text-center max-w-sm">
            <p className="text-lg font-semibold text-text">Wrong Network</p>
            <p className="mt-2 text-sm text-muted">
              Castle requires Monad Testnet (Chain ID: {MONAD_TESTNET_ID}).
            </p>
            <p className="mt-1 text-sm text-muted">
              Please switch your wallet to Monad Testnet.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Connected: full app shell
  return (
    <>
      {/* SideRays full-page background — behind header and all content */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <SideRays
          speed={1.5}
          rayColor1="#5227FF"
          rayColor2="#836EF9"
          intensity={1.5}
          spread={2}
          origin="top-right"
          tilt={0}
          saturation={1.2}
          blend={0.6}
          falloff={1.8}
          opacity={0.6}
        />
      </div>

      <div className="relative z-10 flex h-screen flex-col overflow-hidden">
        {/* Persistent top navigation — transparent so bg shows through */}
        <Topbar />

        {/* Main content - scrollable */}
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-[1200px]">
            <Suspense fallback={<PageLoading />}>
              <PageTransition>
                {children}
              </PageTransition>
            </Suspense>
          </div>
        </main>
      </div>
    </>
  );
}
