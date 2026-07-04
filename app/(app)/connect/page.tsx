"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BlitzIcon } from "@/components/ui/blitz-logo";
import { StatusIcon } from "@/components/app/status-icon";
import AnimatedContent from "@/components/reactbits/interactions/AnimatedContent";
import Stepper, { Step } from "@/components/reactbits/interactions/Stepper";

// Background - lazy loaded, client only (WebGL)
const LiquidEther = dynamic(
  () => import("@/components/reactbits/backgrounds/LiquidEther"),
  { ssr: false }
);

/**
 * /connect - Wallet connection page
 * Split layout: left = big logo + branding, right = agreement stepper card.
 * Walks users through key points and terms before connecting.
 * No app shell visible. Auto-redirects to /dashboard once connected.
 */
export default function ConnectPage() {
  const { isConnected, isReconnecting } = useAccount();
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [stepperComplete, setStepperComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Auto-redirect when connected (or reconnected)
  useEffect(() => {
    if (isConnected) {
      router.replace("/dashboard");
    }
  }, [isConnected, router]);

  // While wagmi is still reconnecting, show nothing to avoid flash
  if (isReconnecting || isConnected) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* LiquidEther background - violet hue, low opacity */}
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <LiquidEther
          colors={["#836EF9", "#5B45D6", "#08080A"]}
          autoDemo={true}
          autoSpeed={0.8}
          autoIntensity={0.3}
        />
      </div>

      {/* LEFT SIDE - Big logo + branding (hidden on mobile, shown on lg+) */}
      <div className="relative z-10 hidden lg:flex lg:w-1/2 items-center justify-center">
        <AnimatedContent
          distance={30}
          direction="vertical"
          duration={0.8}
          ease="power3.out"
          threshold={0.1}
        >
          <div className="flex flex-col items-center gap-6 px-12">
            <BlitzIcon size={96} color="var(--accent)" />
            <h1 className="text-4xl font-bold tracking-tight text-text">
              Blitz
            </h1>
            <p className="max-w-xs text-center text-base text-muted leading-relaxed">
              Secure autonomy for the agent economy on Monad.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <StatusIcon variant="live" size={12} pulse />
              <span className="text-xs text-faint">Monad Testnet</span>
            </div>
          </div>
        </AnimatedContent>
      </div>

      {/* RIGHT SIDE - Agreement card */}
      <div className="relative z-10 flex w-full lg:w-1/2 items-center justify-center px-4 py-12 lg:px-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile-only logo (shown when left side is hidden) */}
          <AnimatedContent
            distance={20}
            direction="vertical"
            duration={0.6}
            ease="power3.out"
            threshold={0.1}
            className="lg:hidden"
          >
            <div className="flex flex-col items-center gap-3 mb-4">
              <BlitzIcon size={48} />
              <h1 className="text-xl font-semibold text-text">
                Welcome to Blitz
              </h1>
            </div>
          </AnimatedContent>

          {/* Header text */}
          <AnimatedContent
            distance={20}
            direction="vertical"
            duration={0.6}
            ease="power3.out"
            threshold={0.1}
          >
            <div className="hidden lg:block">
              <h2 className="text-xl font-semibold text-text">
                Welcome to Blitz
              </h2>
              <p className="mt-1 text-sm text-muted">
                Before you connect, here is what you need to know.
              </p>
            </div>
            <p className="lg:hidden text-center text-sm text-muted">
              Before you connect, here is what you need to know.
            </p>
          </AnimatedContent>

          {/* Stepper: T&C Flow */}
          <AnimatedContent
            distance={30}
            direction="vertical"
            duration={0.7}
            ease="power3.out"
            delay={0.1}
            threshold={0.1}
          >
            {!stepperComplete ? (
              <Stepper
                initialStep={1}
                onStepChange={(step) => setCurrentStep(step)}
                onFinalStepCompleted={() => setStepperComplete(true)}
                backButtonText="Previous"
                nextButtonText="Next"
                disableStepIndicators
                nextButtonProps={
                  currentStep === totalSteps && !termsAccepted
                    ? { disabled: true, style: { opacity: 0.4, cursor: "not-allowed" } }
                    : {}
                }
              >
                {/* Step 1: What is Blitz + How it works (merged) */}
                <Step>
                  <div className="space-y-4 pb-2">
                    <h2 className="text-base font-medium text-text">
                      How Blitz works
                    </h2>
                    <ul className="space-y-2.5 text-sm text-muted">
                      <li className="flex items-start gap-2">
                        <StatusIcon variant="open" size={10} className="mt-1 shrink-0" />
                        Delegate on-chain actions to AI agents without exposing your private key
                      </li>
                      <li className="flex items-start gap-2">
                        <StatusIcon variant="open" size={10} className="mt-1 shrink-0" />
                        Time-boxed session keys with hard-coded spend limits
                      </li>
                      <li className="flex items-start gap-2">
                        <StatusIcon variant="open" size={10} className="mt-1 shrink-0" />
                        Every transaction simulated before signing
                      </li>
                      <li className="flex items-start gap-2">
                        <StatusIcon variant="open" size={10} className="mt-1 shrink-0" />
                        Sessions auto-expire. No dangling permissions.
                      </li>
                    </ul>
                  </div>
                </Step>

                {/* Step 2: Safety */}
                <Step>
                  <div className="space-y-4 pb-2">
                    <h2 className="text-base font-medium text-text">
                      You are always in control
                    </h2>
                    <ul className="space-y-2.5 text-sm text-muted">
                      <li className="flex items-start gap-2">
                        <StatusIcon variant="active" size={10} className="mt-1 shrink-0" />
                        Instant freeze cuts all session access in one click
                      </li>
                      <li className="flex items-start gap-2">
                        <StatusIcon variant="active" size={10} className="mt-1 shrink-0" />
                        Wallet isolation. Sessions can never touch your main wallet.
                      </li>
                      <li className="flex items-start gap-2">
                        <StatusIcon variant="active" size={10} className="mt-1 shrink-0" />
                        Full activity log of every session transaction
                      </li>
                    </ul>
                  </div>
                </Step>

                {/* Step 3: Terms acceptance */}
                <Step>
                  <div className="space-y-4 pb-2">
                    <h2 className="text-base font-medium text-text">
                      Before you connect
                    </h2>
                    <ul className="space-y-2 text-sm text-muted">
                      <li className="flex items-start gap-2">
                        <StatusIcon variant="open" size={10} className="mt-1 shrink-0" />
                        Currently on Monad Testnet. Mainnet tokens are not at risk.
                      </li>
                      <li className="flex items-start gap-2">
                        <StatusIcon variant="open" size={10} className="mt-1 shrink-0" />
                        Smart contracts are audited but no system is risk-free.
                      </li>
                      <li className="flex items-start gap-2">
                        <StatusIcon variant="open" size={10} className="mt-1 shrink-0" />
                        You manage agent permissions and spend limits.
                      </li>
                    </ul>

                    {/* Checkbox */}
                    <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-sm border border-border bg-surface-2 px-4 py-3 transition-colors duration-150 hover:border-border-strong">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="h-4 w-4 shrink-0 appearance-none rounded-sm border border-border-strong bg-surface checked:border-accent checked:bg-accent"
                      />
                      <span className="text-sm text-text">
                        I have read and agree to the terms above
                      </span>
                    </label>
                  </div>
                </Step>
              </Stepper>
            ) : (
              /* After stepper completes: show wallet connect */
              <div className="rounded-sm border border-border bg-surface/95 p-8 backdrop-blur-sm">
                <p className="mb-5 text-center text-sm text-muted">
                  You are all set. Connect your wallet to enter Blitz.
                </p>

                <ConnectButton.Custom>
                  {({ openConnectModal, connectModalOpen }) => (
                    <button
                      onClick={openConnectModal}
                      disabled={connectModalOpen}
                      className="flex h-12 w-full items-center justify-center rounded-sm bg-accent text-sm font-medium text-bg transition-all duration-150 ease-[var(--ease-out)] hover:bg-accent-hover active:scale-[0.97] disabled:opacity-50"
                    >
                      {connectModalOpen ? "Connecting..." : "Connect wallet"}
                    </button>
                  )}
                </ConnectButton.Custom>

                <p className="mt-4 text-center text-xs text-faint">
                  Blitz requires Monad Testnet. Your wallet will be prompted to
                  add and switch to it.
                </p>
              </div>
            )}
          </AnimatedContent>
        </div>
      </div>
    </div>
  );
}
