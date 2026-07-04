"use client";

import AnimatedContent from "@/components/reactbits/interactions/AnimatedContent";
import CountUp from "@/components/reactbits/text/CountUp";

/**
 * Why Monad - Simple section with header + 4 stat cards in a grid.
 */

const SPECS = [
  { value: 1, suffix: "s", prefix: "<", label: "Finality", description: "Real-time settlement for agent-to-agent negotiation.", icon: ZapIcon },
  { value: 10000, suffix: "+", prefix: "", label: "TPS", description: "Parallel execution for thousands of concurrent agents.", icon: LayersIcon },
  { value: 0.001, suffix: "", prefix: "~$", label: "Gas", description: "Near-free transactions make micro-payments viable.", icon: CoinIcon },
  { value: 100, suffix: "%", prefix: "", label: "EVM compatible", description: "ethers.js, Solidity, Tenderly - zero migration.", icon: CodeIcon },
];

export function WhyMonad() {
  return (
    <section className="relative mx-auto max-w-[1100px] px-6 py-24 md:px-12 md:py-32">
      {/* Header */}
      <AnimatedContent distance={24} direction="vertical" duration={0.6} ease="power3.out" threshold={0.2}>
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
            <span className="h-1 w-1 rounded-full bg-accent" />
            <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              Why Monad
            </span>
          </div>
          <h2 className="mx-auto max-w-2xl text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.025em]">
            <span className="bg-gradient-to-b from-text to-muted/80 bg-clip-text text-transparent">
              Built for the speed of
            </span>{" "}
            <span className="text-accent">autonomous agents.</span>
          </h2>
        </div>
      </AnimatedContent>

      {/* 4 cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SPECS.map((spec, i) => (
          <AnimatedContent
            key={i}
            distance={20}
            direction="vertical"
            duration={0.5}
            ease="power3.out"
            delay={i * 0.06}
            threshold={0.2}
          >
            <div className="group h-full rounded-xl border border-white/[0.05] bg-[#0a0a0c] p-5 transition-colors duration-300 hover:border-accent/15">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/8 text-accent border border-accent/10">
                <spec.icon />
              </div>
              <div className="flex items-baseline gap-0.5 mb-1">
                {spec.prefix && <span className="font-mono text-sm text-accent/60">{spec.prefix}</span>}
                <CountUp to={spec.value} from={0} duration={2} delay={i * 0.1} separator="," className="font-mono text-3xl font-semibold text-accent leading-none" />
                {spec.suffix && <span className="font-mono text-sm text-accent/60">{spec.suffix}</span>}
              </div>
              <p className="text-sm font-medium text-text">{spec.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{spec.description}</p>
            </div>
          </AnimatedContent>
        ))}
      </div>
    </section>
  );
}

function ZapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M14.5 9a3.5 3.5 0 0 0-5 0M9.5 15a3.5 3.5 0 0 0 5 0" />
      <path d="M12 6v2M12 16v2" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
