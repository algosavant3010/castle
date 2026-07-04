"use client";

import { useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

/**
 * How It Works — Minimal vertical section with SVG line-draw animations.
 * Three primitives connected by an animated path that draws on scroll.
 */

const STEPS = [
  {
    eyebrow: "Account abstraction",
    title: "Owner and signer, separated",
    description:
      "A smart contract wallet splits the human from the AI. The agent operates, but the chain enforces the boundary.",
    icon: WalletIcon,
    svgAnim: WalletAnim,
    video: "/v1.mp4",
  },
  {
    eyebrow: "Session keys",
    title: "Time-boxed authority",
    description:
      "Temporary keypair with hard limits: expiry, spend cap, allowed targets. Monad rejects violations on-chain.",
    icon: KeyIcon,
    svgAnim: KeyAnim,
    video: "/v2.mp4",
  },
  {
    eyebrow: "Pre-sign simulation",
    title: "Simulate before signing",
    description:
      "Every tx simulated against live state before the key signs. A mismatch aborts. Zero false negatives.",
    icon: ShieldIcon,
    svgAnim: ShieldAnim,
    video: "/v3.mp4",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const stepsRef = useRef<HTMLDivElement[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          all: "(min-width: 1px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { reduceMotion } = ctx.conditions!;
          if (reduceMotion) return;

          // Animate the connecting SVG path drawing on scroll
          if (pathRef.current) {
            const length = pathRef.current.getTotalLength();
            gsap.set(pathRef.current, {
              strokeDasharray: length,
              strokeDashoffset: length,
            });
            gsap.to(pathRef.current, {
              strokeDashoffset: 0,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top 60%",
                end: "bottom 70%",
                scrub: 1,
              },
            });
          }

          // Staggered step reveals
          stepsRef.current.forEach((step, i) => {
            if (!step) return;

            gsap.fromTo(
              step,
              { opacity: 0, y: 32 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: step,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                },
              }
            );

            // Animate the SVG illustration inside each step
            const paths = step.querySelectorAll(".anim-path");
            paths.forEach((p, pi) => {
              const el = p as SVGPathElement | SVGCircleElement | SVGLineElement;
              if ("getTotalLength" in el && typeof el.getTotalLength === "function") {
                const len = el.getTotalLength();
                gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
                gsap.to(el, {
                  strokeDashoffset: 0,
                  duration: 0.8,
                  delay: 0.2 + pi * 0.15,
                  ease: "power2.out",
                  scrollTrigger: {
                    trigger: step,
                    start: "top 80%",
                    toggleActions: "play none none reverse",
                  },
                });
              }
            });
          });
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-28 md:py-36 overflow-hidden"
    >
      {/* Section header */}
      <div className="mx-auto max-w-3xl px-6 text-center mb-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
            How it works
          </span>
        </div>
        <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
          <span className="bg-gradient-to-b from-text to-muted/80 bg-clip-text text-transparent">
            Three on-chain primitives.
          </span>
          <br />
          <span className="text-accent">Absolute safety.</span>
        </h2>
      </div>

      {/* Steps with connecting line */}
      <div className="relative mx-auto max-w-5xl px-6 md:px-12">
        {/* Connecting SVG path (visible on md+) */}
        <svg
          className="absolute left-1/2 top-0 h-full w-px pointer-events-none hidden md:block"
          viewBox="0 0 2 600"
          preserveAspectRatio="none"
          style={{ transform: "translateX(-50%)" }}
        >
          <path
            ref={pathRef}
            d="M1 0 V600"
            fill="none"
            stroke="rgba(131, 110, 249, 0.25)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Step cards */}
        <div className="grid gap-20 md:gap-28">
          {STEPS.map((step, i) => {
            const isEven = i % 2 === 0;
            return (
              <div
                key={i}
                ref={(el) => { if (el) stepsRef.current[i] = el; }}
                className={`relative grid md:grid-cols-2 gap-8 md:gap-16 items-center ${
                  isEven ? "" : "md:[direction:rtl]"
                }`}
              >
                {/* Text content */}
                <div className={isEven ? "" : "md:[direction:ltr]"}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 border border-accent/15 text-[11px] font-bold text-accent">
                      {i + 1}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent/80">
                      {step.eyebrow}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-text tracking-[-0.015em] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[15px] leading-[1.7] text-muted max-w-sm">
                    {step.description}
                  </p>
                </div>

                {/* Video or SVG animation */}
                <div className={`flex justify-center ${isEven ? "" : "md:[direction:ltr]"}`}>
                  <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center overflow-hidden rounded-2xl">
                    {/* Ambient glow */}
                    <div className="absolute inset-0 rounded-full bg-accent/[0.04] blur-2xl" />
                    {step.video ? (
                      <LoopingVideo src={step.video} />
                    ) : (
                      <step.svgAnim />
                    )}
                  </div>
                </div>

                {/* Center dot on timeline (md+) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-accent/60 border-2 border-bg shadow-[0_0_12px_rgba(131,110,249,0.4)]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Looping Video Component ────────────────────────── */

function LoopingVideo({ src }: { src: string }) {
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (!node) return;

    // Force loop restart on ended (backup for browsers ignoring loop attr)
    const handleEnded = () => {
      node.currentTime = 0;
      node.play().catch(() => {});
    };

    // Re-trigger play when video becomes visible again
    const handleVisibility = () => {
      if (!document.hidden && node.paused) {
        node.play().catch(() => {});
      }
    };

    node.addEventListener("ended", handleEnded);
    document.addEventListener("visibilitychange", handleVisibility);

    // Ensure playback starts
    node.play().catch(() => {});

    return () => {
      node.removeEventListener("ended", handleEnded);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
      src={src}
    />
  );
}

/* ─── SVG Animated Illustrations ─────────────────────── */

function WalletAnim() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <defs>
        {/* Subtle glass fill for the wallet body */}
        <linearGradient id="walletGlass" x1="20" y1="30" x2="20" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
        {/* Accent glow for owner side */}
        <radialGradient id="ownerGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#836EF9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#836EF9" stopOpacity="0" />
        </radialGradient>
        {/* Accent glow for agent side */}
        <radialGradient id="agentGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#9D8BFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#9D8BFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient background glow */}
      <circle cx="60" cy="60" r="48" fill="rgba(131,110,249,0.03)" />

      {/* Wallet body - glass surface */}
      <rect
        x="20" y="32" width="80" height="56" rx="14"
        fill="url(#walletGlass)"
      />
      <rect
        className="anim-path"
        x="20" y="32" width="80" height="56" rx="14"
        stroke="rgba(131,110,249,0.5)"
        strokeWidth="1.2"
      />

      {/* Inner highlight line along top edge */}
      <path
        d="M34 32.6 H86"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.5"
        strokeLinecap="round"
      />

      {/* Separation line - frosted divider */}
      <line
        className="anim-path"
        x1="60" y1="38" x2="60" y2="82"
        stroke="rgba(131,110,249,0.2)"
        strokeWidth="0.8"
        strokeDasharray="2 3"
      />

      {/* Owner side ambient glow */}
      <circle cx="40" cy="56" r="14" fill="url(#ownerGlow)" />
      {/* Agent side ambient glow */}
      <circle cx="80" cy="56" r="14" fill="url(#agentGlow)" />

      {/* Owner icon - person silhouette */}
      <circle cx="40" cy="52" r="4" stroke="#836EF9" strokeWidth="1.2" fill="none" />
      <path
        d="M33 64 A7 7 0 0 1 47 64"
        stroke="#836EF9"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Agent icon - circuit/bot node */}
      <rect x="75" y="48" width="10" height="10" rx="2.5" stroke="#9D8BFF" strokeWidth="1.2" fill="none" />
      <circle cx="80" cy="53" r="1.5" fill="#9D8BFF" />
      {/* Connection nodes */}
      <line x1="80" y1="58" x2="80" y2="62" stroke="#9D8BFF" strokeWidth="1" strokeLinecap="round" />
      <circle cx="80" cy="63.5" r="1" fill="#9D8BFF" opacity="0.6" />
      <line x1="75" y1="53" x2="72" y2="53" stroke="#9D8BFF" strokeWidth="1" strokeLinecap="round" />
      <circle cx="71" cy="53" r="1" fill="#9D8BFF" opacity="0.6" />
      <line x1="85" y1="53" x2="88" y2="53" stroke="#9D8BFF" strokeWidth="1" strokeLinecap="round" />
      <circle cx="89" cy="53" r="1" fill="#9D8BFF" opacity="0.6" />

      {/* Labels */}
      <text x="33" y="80" fontSize="7" fill="#8A8A93" fontFamily="monospace" letterSpacing="0.5">owner</text>
      <text x="73" y="80" fontSize="7" fill="#8A8A93" fontFamily="monospace" letterSpacing="0.5">agent</text>

      {/* Card slot notch on right edge */}
      <path
        className="anim-path"
        d="M100 48 A4 4 0 0 1 100 64"
        stroke="rgba(157,139,255,0.4)"
        strokeWidth="1"
      />
    </svg>
  );
}

function KeyAnim() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      {/* Clock circle (time-boxed) */}
      <circle
        className="anim-path"
        cx="60"
        cy="55"
        r="35"
        stroke="#836EF9"
        strokeWidth="1.5"
      />
      {/* Clock tick marks */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 60 + Math.cos(rad) * 31;
        const y1 = 55 + Math.sin(rad) * 31;
        const x2 = 60 + Math.cos(rad) * 35;
        const y2 = 55 + Math.sin(rad) * 35;
        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#836EF9"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        );
      })}
      {/* Clock hand - animated */}
      <path
        className="anim-path"
        d="M60 55 L60 32"
        stroke="#9D8BFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        className="anim-path"
        d="M60 55 L75 55"
        stroke="#9D8BFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Key shape at center */}
      <circle cx="60" cy="55" r="5" fill="none" stroke="#836EF9" strokeWidth="1.5" />
      <circle cx="60" cy="55" r="2" fill="#836EF9" />
      {/* Expiry indicator arc */}
      <path
        className="anim-path"
        d="M60 20 A35 35 0 0 1 95 55"
        stroke="#5B45D6"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* 24h label */}
      <text x="45" y="100" fontSize="9" fill="#8A8A93" fontFamily="monospace">24h max</text>
    </svg>
  );
}

function ShieldAnim() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      {/* Shield outline */}
      <path
        className="anim-path"
        d="M60 15 L95 30 V60 C95 82 60 105 60 105 C60 105 25 82 25 60 V30 L60 15Z"
        stroke="#836EF9"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Inner shield */}
      <path
        className="anim-path"
        d="M60 28 L83 39 V58 C83 74 60 90 60 90 C60 90 37 74 37 58 V39 L60 28Z"
        stroke="#5B45D6"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.4"
      />
      {/* Checkmark */}
      <path
        className="anim-path"
        d="M47 58 L55 66 L73 48"
        stroke="#34D399"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Scanning lines */}
      <path
        className="anim-path"
        d="M40 45 H50"
        stroke="#9D8BFF"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        className="anim-path"
        d="M70 45 H80"
        stroke="#9D8BFF"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        className="anim-path"
        d="M42 75 H55"
        stroke="#9D8BFF"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        className="anim-path"
        d="M65 75 H78"
        stroke="#9D8BFF"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

/* ─── Icons (compact) ─────────────────────────────────── */

function WalletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.3 9.3" />
      <path d="M18 5l3-3" />
      <path d="m15 8 3-3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
