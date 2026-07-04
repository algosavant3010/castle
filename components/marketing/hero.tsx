"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// React Bits - text animations
import BlurText from "@/components/reactbits/text/BlurText";
import ShinyText from "@/components/reactbits/text/ShinyText";
import RotatingText from "@/components/reactbits/text/RotatingText";

// React Bits - interactions
import ClickSpark from "@/components/reactbits/interactions/ClickSpark";

// React Bits - backgrounds
import LaserFlow from "@/components/reactbits/backgrounds/LaserFlow";

/**
 * Hero Section
 * - Atmospheric glowing orbs as background
 * - Large headline with gradient text
 * - Animated Shield Intercept visualization
 * - Floating depth layers
 */

interface ThreatEvent {
  id: number;
  agent: string;
  action: string;
  amount: string;
  status: "scanning" | "safe" | "blocked";
  risk: "low" | "medium" | "critical";
  timestamp: string;
}

const threatPool: Omit<ThreatEvent, "id" | "status" | "timestamp">[] = [
  { agent: "alpha-7", action: "swap USDC → MON", amount: "120 USDC", risk: "low" },
  { agent: "rebalancer", action: "approve unlimited DAI", amount: "∞ DAI", risk: "critical" },
  { agent: "yield-bot", action: "deposit to vault", amount: "2.4 ETH", risk: "low" },
  { agent: "sniper-v2", action: "transfer DEGEN out", amount: "50,000 DEGEN", risk: "medium" },
  { agent: "arb-engine", action: "flash loan exploit", amount: "500 ETH", risk: "critical" },
  { agent: "dca-bot", action: "swap USDC → MON", amount: "25 USDC", risk: "low" },
  { agent: "lp-manager", action: "remove all liquidity", amount: "14.2 ETH", risk: "medium" },
  { agent: "hedge-v3", action: "bridge to L2", amount: "10 ETH", risk: "low" },
  { agent: "mev-scout", action: "sandwich attack", amount: "890 USDC", risk: "critical" },
  { agent: "gov-voter", action: "delegate votes", amount: "1.2M GOV", risk: "low" },
  { agent: "nft-sniper", action: "approve collection", amount: "∞ NFTs", risk: "critical" },
  { agent: "treasury", action: "payroll batch", amount: "45,000 USDC", risk: "low" },
  { agent: "liquidator", action: "seize collateral", amount: "320 ETH", risk: "medium" },
  { agent: "compounder", action: "claim + restake", amount: "2,100 MON", risk: "low" },
];

function getTimeString() {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function ShieldVisualization() {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [stats, setStats] = useState({ scanned: 0, blocked: 0, passed: 0, savedUsd: 0 });
  const [ripple, setRipple] = useState(false);
  const [shieldIntegrity] = useState(99.7);
  const idRef = useRef(0);
  const lastIndexRef = useRef(-1);

  const addEvent = useCallback(() => {
    // Avoid repeating the same event twice in a row
    let idx = Math.floor(Math.random() * threatPool.length);
    if (idx === lastIndexRef.current) idx = (idx + 1) % threatPool.length;
    lastIndexRef.current = idx;

    const template = threatPool[idx];
    const id = ++idRef.current;
    const newEvent: ThreatEvent = { ...template, id, status: "scanning", timestamp: getTimeString() };

    setEvents((prev) => [newEvent, ...prev].slice(0, 4));

    // Resolve after simulated analysis time
    const resolveTime = template.risk === "critical" ? 1800 : template.risk === "medium" ? 1200 : 800;
    setTimeout(() => {
      const isBlocked = template.risk === "critical";
      const isMediumBlocked = template.risk === "medium" && Math.random() > 0.6;
      const blocked = isBlocked || isMediumBlocked;

      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: blocked ? "blocked" : "safe" } : e))
      );
      setStats((s) => ({
        scanned: s.scanned + 1,
        blocked: s.blocked + (blocked ? 1 : 0),
        passed: s.passed + (blocked ? 0 : 1),
        savedUsd: s.savedUsd + (blocked ? Math.floor(Math.random() * 50000) + 5000 : 0),
      }));
      if (blocked) {
        setRipple(true);
        setTimeout(() => setRipple(false), 700);
      }
    }, resolveTime);
  }, []);

  useEffect(() => {
    // Staggered initial burst for visual impact
    const t1 = setTimeout(addEvent, 300);
    const t2 = setTimeout(addEvent, 800);
    const t3 = setTimeout(addEvent, 1400);
    const interval = setInterval(addEvent, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, [addEvent]);

  return (
    <div className="group relative w-full max-w-4xl mx-auto">
      {/* Outer shield glow */}
      <div
        className={`absolute -inset-8 rounded-3xl blur-3xl transition-all duration-700 ease-[var(--ease-out)] ${
          ripple ? "opacity-50 scale-[1.03]" : "opacity-15 scale-100"
        }`}
        style={{
          background: ripple
            ? "radial-gradient(ellipse at center, var(--danger) 0%, transparent 70%)"
            : "radial-gradient(ellipse at center, var(--accent) 0%, transparent 70%)",
        }}
      />

      {/* Gradient border effect - laser-matched glow */}
      <div className="relative rounded-2xl glow-border shadow-[0_0_30px_rgba(131,110,249,0.15),inset_0_0_30px_rgba(131,110,249,0.05)]" style={{ border: "1px solid rgba(131, 110, 249, 0.3)" }}>
        {/* Main container */}
        <div className="relative overflow-hidden rounded-2xl glass-strong shadow-[0_0_120px_-30px_rgba(131,110,249,0.18)]">
          {/* Top bar - live indicator + stats */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-safe/50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-safe" />
              </span>
              <span className="font-mono text-[12px] text-safe/90 font-medium tracking-wide">
                SHIELD ACTIVE
              </span>
              <span className="hidden sm:inline-block h-3 w-px bg-white/[0.08]" />
              <span className="hidden sm:inline-block font-mono text-[10px] text-faint">
                integrity {shieldIntegrity}%
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 font-mono text-[11px] text-faint">
              <span className="hidden sm:inline">
                scanned <span className="text-muted tabular-nums">{stats.scanned}</span>
              </span>
              <span>
                passed <span className="text-safe tabular-nums">{stats.passed}</span>
              </span>
              <span>
                blocked <span className="text-danger tabular-nums">{stats.blocked}</span>
              </span>
            </div>
          </div>

        {/* Shield core - radar + feed */}
          <div className="grid md:grid-cols-[1fr_1.6fr] min-h-[280px]">
            {/* Left: Advanced radar visualization */}
            <div className="relative flex items-center justify-center border-b md:border-b-0 md:border-r border-white/[0.06] p-6 overflow-hidden">
              {/* Background radial gradient for depth */}
              <div
                className={`absolute inset-0 transition-all duration-700 ${
                  ripple ? "opacity-100" : "opacity-60"
                }`}
                style={{
                  background: ripple
                    ? "radial-gradient(circle at center, rgba(251,106,106,0.08) 0%, transparent 60%)"
                    : "radial-gradient(circle at center, rgba(131,110,249,0.06) 0%, transparent 60%)",
                }}
              />

              {/* Hexagonal grid overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 200 200">
                <defs>
                  <pattern id="hex-grid" width="28" height="49" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
                    <path d="M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z" fill="none" stroke="white" strokeWidth="0.5" />
                    <path d="M14 17 L28 25 L28 41 L14 49 L0 41 L0 25 Z" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="200" height="200" fill="url(#hex-grid)" />
              </svg>

              {/* Radar container */}
              <div className="relative w-48 h-48">
                {/* Radar sweep beam - conic gradient */}
                <div
                  className="absolute inset-0 rounded-full animate-[spin_3s_linear_infinite]"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, ${
                      ripple ? "rgba(251,106,106,0.15)" : "rgba(131,110,249,0.12)"
                    } 30deg, transparent 60deg)`,
                  }}
                />

                {/* Ripple rings that expand on block */}
                {ripple && (
                  <>
                    <div className="absolute inset-4 rounded-full border border-danger/30 animate-[rippleExpand_0.8s_ease-out_forwards]" />
                    <div className="absolute inset-8 rounded-full border border-danger/20 animate-[rippleExpand_0.8s_ease-out_0.15s_forwards]" />
                  </>
                )}

                {/* Orbit paths - subtle solid rings */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 192 192">
                  <circle cx="96" cy="96" r="68" fill="none" strokeWidth="0.5" className="stroke-accent/[0.06]" />
                  <circle cx="96" cy="96" r="46" fill="none" strokeWidth="0.5" className="stroke-accent/[0.05]" />
                </svg>

                {/* Orbiting agent dots */}
                {/* Agent 1 - outer orbit, fast */}
                <div className="absolute inset-0 animate-[spin_5s_linear_infinite]">
                  <div className="absolute top-[2px] left-1/2 -translate-x-1/2">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(131,110,249,0.8),0_0_20px_rgba(131,110,249,0.3)]" />
                  </div>
                </div>
                {/* Agent 2 - outer orbit, opposite side, slower */}
                <div className="absolute inset-0 animate-[spin_7s_linear_infinite]" style={{ animationDelay: "-3s" }}>
                  <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2">
                    <div className="w-2 h-2 rounded-full bg-accent/80 shadow-[0_0_6px_rgba(131,110,249,0.6),0_0_14px_rgba(131,110,249,0.2)]" />
                  </div>
                </div>
                {/* Agent 3 - middle orbit */}
                <div className="absolute inset-[22px] animate-[spin_6s_linear_infinite]" style={{ animationDelay: "-2s" }}>
                  <div className="absolute bottom-0 right-[10%]">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/70 shadow-[0_0_5px_rgba(131,110,249,0.5)]" />
                  </div>
                </div>
                {/* Agent 5 - inner orbit, fast */}
                <div className="absolute inset-[44px] animate-[spin_4s_linear_infinite]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2">
                    <div className="w-1.5 h-1.5 rounded-full bg-safe/80 shadow-[0_0_5px_rgba(52,211,153,0.6)]" />
                  </div>
                </div>
                {/* Core shield icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 backdrop-blur-sm ${
                      ripple
                        ? "bg-danger/12 shadow-[0_0_50px_rgba(251,106,106,0.4),0_0_100px_rgba(251,106,106,0.15)]"
                        : "bg-accent/8 shadow-[0_0_40px_rgba(131,110,249,0.25),0_0_80px_rgba(131,110,249,0.1)]"
                    }`}
                  >
                    {/* Breathing ring */}
                    <div
                      className={`absolute inset-[-4px] rounded-full border transition-colors duration-500 animate-[breathe_3s_ease-in-out_infinite] ${
                        ripple ? "border-danger/30" : "border-accent/20"
                      }`}
                    />
                    <svg
                      viewBox="0 0 24 24"
                      className={`relative w-7 h-7 transition-all duration-300 ${
                        ripple ? "text-danger scale-110" : "text-accent"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M12 2l8 4v6c0 5.25-3.5 8.75-8 10-4.5-1.25-8-4.75-8-10V6l8-4z" />
                      {ripple ? (
                        <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" />
                      ) : (
                        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </svg>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Live threat feed */}
            <div className="p-5 flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-accent/60 animate-pulse" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
                    Live intercept feed
                  </span>
                </div>
                {stats.savedUsd > 0 && (
                  <span className="font-mono text-[10px] text-safe/80">
                    ${stats.savedUsd.toLocaleString()} saved
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2 overflow-hidden">
                {events.map((event, i) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-[11px] transition-all duration-500 ease-[var(--ease-out)] animate-[slideIn_0.3s_ease-out] ${
                      event.status === "scanning"
                        ? "bg-white/[0.02] border border-white/[0.06]"
                        : event.status === "blocked"
                          ? "bg-danger/[0.08] border border-danger/25 shadow-[inset_0_0_20px_rgba(251,106,106,0.05)]"
                          : "bg-safe/[0.04] border border-safe/15"
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Status indicator */}
                    <span className="shrink-0 w-4 flex justify-center">
                      {event.status === "scanning" && (
                        <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                      )}
                      {event.status === "safe" && (
                        <svg className="w-3.5 h-3.5 text-safe" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                          <path d="M4 7l2.5 2.5L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {event.status === "blocked" && (
                        <svg className="w-3.5 h-3.5 text-danger" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                          <path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>

                    {/* Event details */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-accent/90 font-medium">{event.agent}</span>
                      <span className="text-faint/50">·</span>
                      <span className="text-muted/80 truncate">{event.action}</span>
                    </div>

                    {/* Amount */}
                    <span className={`shrink-0 text-[10px] tabular-nums ${
                      event.status === "blocked" ? "text-danger/90" : "text-faint"
                    }`}>
                      {event.amount}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        event.status === "scanning"
                          ? "text-accent/70 bg-accent/[0.08]"
                          : event.status === "blocked"
                            ? "text-danger bg-danger/[0.12]"
                            : "text-safe/80 bg-safe/[0.08]"
                      }`}
                    >
                      {event.status === "scanning" ? "SIM" : event.status === "blocked" ? "DENY" : "OK"}
                    </span>
                  </div>
                ))}

                {events.length === 0 && (
                  <div className="flex items-center justify-center h-full text-faint text-[11px] font-mono">
                    awaiting transactions...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between border-t border-white/[0.06] bg-bg/40 px-5 py-2.5">
            <div className="flex items-center gap-3">
              <span className="h-1 w-1 rounded-full bg-accent/40 animate-pulse" />
              <span className="font-mono text-[10px] text-faint">
                pre-sign simulation engine v2
              </span>
              <span className="hidden sm:inline-block h-3 w-px bg-white/[0.06]" />
              <span className="hidden sm:inline-block font-mono text-[10px] text-faint/60">
                monad testnet
              </span>
            </div>
            <span className="font-mono text-[10px] text-safe/50">
              p95 latency &lt;12ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Atmospheric glowing orbs - Serendale style */}
      <div className="absolute inset-0 z-0 motion-reduce:hidden">
        {/* Primary orb - top center */}
        <div
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full animate-glow-pulse"
          style={{
            background: "radial-gradient(circle, rgba(131, 110, 249, 0.15) 0%, transparent 70%)",
          }}
        />
        {/* Secondary orb - left */}
        <div
          className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] rounded-full animate-glow-drift"
          style={{
            background: "radial-gradient(circle, rgba(91, 69, 214, 0.1) 0%, transparent 70%)",
          }}
        />
        {/* Tertiary orb - right */}
        <div
          className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full animate-glow-drift"
          style={{
            background: "radial-gradient(circle, rgba(131, 110, 249, 0.08) 0%, transparent 70%)",
            animationDelay: "-4s",
          }}
        />
        {/* Bottom accent */}
        <div
          className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(131, 110, 249, 0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-32 pb-20 md:px-12 md:pt-40 md:pb-28 w-full max-w-6xl mx-auto">
        {/* Eyebrow badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <ShinyText
            text="Secure autonomy on Monad"
            speed={3}
            color="var(--text-muted)"
            shineColor="var(--accent)"
            className="text-[13px] font-medium text-muted"
          />
        </div>

        {/* Headline - large with gradient text */}
        <h1 className="max-w-4xl text-center text-[clamp(3rem,7vw,5rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
          <span className="bg-gradient-to-b from-text via-text to-muted/60 bg-clip-text text-transparent">
            Let agents transact.
          </span>
          <br />
          <span className="block text-center">
            <span className="bg-gradient-to-b from-accent to-accent-hover bg-clip-text text-transparent">
              Keep your funds
            </span>
          </span>
          <span className="flex justify-center">
            <RotatingText
              texts={["untouchable.", "protected.", "sovereign.", "unbreachable.", "yours."]}
              mainClassName="inline-flex overflow-hidden bg-gradient-to-b from-accent to-accent-hover bg-clip-text text-transparent"
              elementLevelClassName="bg-gradient-to-b from-accent to-accent-hover bg-clip-text text-transparent"
              staggerFrom="last"
              staggerDuration={0.025}
              rotationInterval={2500}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
            />
          </span>
        </h1>

        {/* Subtext */}
        <div className="mt-8 max-w-xl">
          <BlurText
            text="Time-boxed session keys, on-chain spend limits, and pre-sign simulation. The blockchain enforces the rules your agent cannot break."
            className="justify-center text-center text-[1.1rem] leading-[1.7] text-muted [text-wrap:pretty]"
            animateBy="words"
            direction="top"
            delay={25}
            stepDuration={0.4}
          />
        </div>

        {/* CTA row */}
        <div className="mt-12 flex flex-col items-center gap-5">
          <div className="flex items-center justify-center gap-5">
            <ClickSpark sparkColor="var(--accent)" sparkSize={8} sparkCount={6}>
              <a
                href="/dashboard"
                className="group relative inline-flex h-13 items-center whitespace-nowrap rounded-full bg-accent px-8 text-sm font-medium text-bg transition-all duration-300 ease-[var(--ease-out)] hover:bg-accent-hover hover:scale-[1.03] active:scale-[0.97]"
              >
                <span className="relative z-10">Go to app</span>
                <div className="absolute inset-0 rounded-full bg-accent opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
              </a>
            </ClickSpark>
            <a
              href="#"
              className="inline-flex h-13 items-center whitespace-nowrap rounded-full border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm px-8 text-sm font-medium text-muted transition-all duration-300 hover:border-white/[0.2] hover:text-text hover:bg-white/[0.06] active:scale-[0.97]"
            >
              Read the docs
            </a>
          </div>
          <a
            href="#how-it-works"
            className="whitespace-nowrap text-sm text-muted transition-colors hover:text-text"
          >
            <ShinyText text="How it works ↓" speed={4} color="var(--text-muted)" shineColor="var(--text)" />
          </a>
        </div>

        {/* Shield intercept visualization */}
        <div className="mt-20 w-full relative">
          {/* LaserFlow - beam shoots upward from box top into the hero bg, behind hero content */}
          <div
            className="absolute pointer-events-none overflow-hidden"
            style={{
              top: "-400px",
              left: 0,
              right: 0,
              height: "500px",
              zIndex: -1,
            }}
          >
            <LaserFlow
              color="#836ef9"
              horizontalBeamOffset={0.15}
              verticalBeamOffset={-0.32}
              verticalSizing={3.0}
              horizontalSizing={0.7}
              fogIntensity={0.5}
              fogScale={0.3}
              wispDensity={1.0}
              wispSpeed={12.0}
              wispIntensity={5.0}
              flowSpeed={0.3}
              flowStrength={0.25}
              decay={1.2}
              falloffStart={1.3}
              fogFallSpeed={0.5}
              mouseTiltStrength={0.005}
            />
          </div>
          <ShieldVisualization />
        </div>
      </div>
    </section>
  );
}
