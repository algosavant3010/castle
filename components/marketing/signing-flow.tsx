"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// React Bits
import RotatingText from "@/components/reactbits/text/RotatingText";
import StarBorder from "@/components/reactbits/interactions/StarBorder";
import FadeContent from "@/components/reactbits/interactions/FadeContent";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Signing Flow - uses RotatingText, StarBorder, FadeContent.
 *
 * - RotatingText cycles through the transaction lifecycle steps.
 * - StarBorder wraps the "sign" step CTA for the brand accent orbit.
 * - FadeContent for each step's entrance.
 * - Bolt draw-on at the sign step.
 */

const STEPS = [
  { label: "Intent", mono: "acceptTask(taskId: 128)", description: "Agent decides to accept a marketplace task" },
  { label: "Draft", mono: "tx.to = 0x7a25...3f91", description: "ethers.js drafts the raw transaction (unsigned)" },
  { label: "Simulate", mono: "eth_call -> Tenderly", description: "State-diff computed against live chain state" },
  { label: "State diff", mono: "-50 USDC, +50 MONAD", description: "Reviewer LLM compares intent vs simulation" },
  { label: "Sign", mono: "sessionKey.sign(tx)", description: "Session Key signs after simulation passes" },
  { label: "Broadcast", mono: "tx confirmed (0.4s)", description: "Broadcast to Monad, sub-second finality" },
];

export function SigningFlow() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // No bolt animation needed
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-[1200px] overflow-hidden px-6 py-24 md:px-12 md:py-32"
    >
      {/* Lightning background - REMOVED */}

      <div className="relative z-10">
      <div className="mb-12">
        <p className="mb-3 font-mono text-[13px] uppercase tracking-[0.04em] text-muted">
          The signing flow
        </p>
        <h2 className="max-w-md text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-text [text-wrap:balance]">
          From{" "}
          <RotatingText
            texts={["intent", "draft", "simulation", "verification", "signature"]}
            mainClassName="inline-flex text-accent"
            staggerFrom="last"
            staggerDuration={0.025}
            rotationInterval={2000}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          />{" "}
          to finality
        </h2>
      </div>

      <div className="grid gap-12 md:grid-cols-2 md:items-start">
        {/* Steps column */}
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <FadeContent key={i} blur={true} duration={600} delay={i * 80} threshold={0.2}>
              <div
                className={`rounded-sm border p-4 transition-all ${
                  step.label === "Sign"
                    ? "border-accent/40 bg-accent-soft"
                    : "border-border bg-surface"
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[10px] font-medium text-accent">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-text">{step.label}</span>
                </div>
                <p className="font-mono text-xs text-muted">{step.mono}</p>
                <p className="mt-1 text-sm text-faint">{step.description}</p>
              </div>
            </FadeContent>
          ))}

          {/* StarBorder CTA at the bottom */}
          <div className="pt-4">
            <StarBorder
              as="a"
              color="var(--accent)"
              speed="4s"
              className="block w-full text-center"
            >
              View full signing architecture
            </StarBorder>
          </div>
        </div>

        {/* Center spacer (bolt removed) */}
        <div className="hidden md:block" />

        {/* Right: description panel */}
        <div className="hidden md:block">
          <FadeContent blur={true} duration={800} threshold={0.3}>
            <div className="rounded-sm border border-border bg-surface-2 p-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.04em] text-faint">
                Transaction lifecycle
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Every agent transaction passes through this pipeline. The simulation gate
                catches malicious payloads before any key touches them. The Session Key
                signs only after the state-diff matches the original intent.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Monad&apos;s sub-second finality means the entire flow from intent to
                confirmed settlement happens in under a second.
              </p>
            </div>
          </FadeContent>
        </div>
      </div>
      </div>
    </section>
  );
}
