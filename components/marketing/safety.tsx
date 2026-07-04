"use client";

import AnimatedContent from "@/components/reactbits/interactions/AnimatedContent";
import ScrambledText from "@/components/reactbits/text/ScrambledText";

/**
 * Safety / Human Override - Serendale-inspired glass cards with glowing
 * semantic accents and strong visual hierarchy.
 */

export function Safety() {
  return (
    <section
      id="security"
      className="relative mx-auto max-w-[1200px] px-6 py-28 md:px-12 md:py-36"
    >
      {/* Background glow - danger-tinted */}
      <div
        className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full opacity-10 blur-3xl motion-reduce:hidden"
        style={{
          background: "radial-gradient(circle, rgba(251, 106, 106, 0.3) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[20%] left-[5%] w-[350px] h-[350px] rounded-full opacity-10 blur-3xl motion-reduce:hidden"
        style={{
          background: "radial-gradient(circle, rgba(245, 181, 68, 0.2) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10">
        {/* Section header */}
        <AnimatedContent distance={30} direction="vertical" duration={0.7} ease="power3.out" threshold={0.2}>
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
              <span className="h-1 w-1 rounded-full bg-danger" />
              <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
                Human override
              </span>
            </div>
            <h2 className="mx-auto max-w-xl text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.025em]">
              <span className="bg-gradient-to-b from-text to-muted/80 bg-clip-text text-transparent">
                Absolute control, instantly.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted">
              When something goes wrong, you have two nuclear options that execute within a block.
            </p>
          </div>
        </AnimatedContent>

        {/* Cards grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Freeze card */}
          <AnimatedContent distance={30} direction="vertical" duration={0.7} ease="power3.out" delay={0.05} threshold={0.2}>
            <div className="group relative h-full overflow-hidden rounded-2xl">
              {/* Glow border on hover */}
              <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(251, 106, 106, 0.2), transparent 50%, rgba(251, 106, 106, 0.1))",
                  }}
                />
              </div>

              <div className="relative h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-7 transition-all duration-500 group-hover:border-danger/20 group-hover:bg-white/[0.04]">
                {/* Icon + Title */}
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 transition-colors duration-300 group-hover:bg-danger/15">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M12 2v20M2 12h20M5.64 5.64l12.72 12.72M18.36 5.64L5.64 18.36" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text">freezeAgent()</h3>
                    <p className="text-[12px] text-danger/70">Reversible</p>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-5 text-sm leading-[1.7] text-muted">
                  Instantly revokes every active Session Key for this agent. The agent
                  starts receiving Unauthorized within a block. Sub-second finality
                  means the freeze takes effect before pending transactions can settle.
                </p>

                {/* Scrambled text detail */}
                <div className="mb-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                  <ScrambledText
                    radius={80}
                    duration={0.8}
                    speed={0.4}
                    scrambleChars="!@#$%^&*()"
                    className="!m-0 !max-w-none !text-xs"
                  >
                    freezeAgent() -&gt; revokes session keys -&gt; Unauthorized within 1 block
                  </ScrambledText>
                </div>

                {/* Footer note */}
                <div className="rounded-xl bg-surface-2/50 p-3">
                  <p className="font-mono text-xs text-faint">
                    Reversible. The agent can be re-authorized with a new Session Key.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedContent>

          {/* Emergency Withdraw card */}
          <AnimatedContent distance={30} direction="vertical" duration={0.7} ease="power3.out" delay={0.1} threshold={0.2}>
            <div className="group relative h-full overflow-hidden rounded-2xl">
              {/* Glow border on hover */}
              <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(245, 181, 68, 0.2), transparent 50%, rgba(245, 181, 68, 0.1))",
                  }}
                />
              </div>

              <div className="relative h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-7 transition-all duration-500 group-hover:border-warning/20 group-hover:bg-white/[0.04]">
                {/* Icon + Title */}
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 transition-colors duration-300 group-hover:bg-warning/15">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v4M12 17h.01" />
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text">emergencyWithdraw()</h3>
                    <p className="text-[12px] text-warning/70">Irreversible sweep</p>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-5 text-sm leading-[1.7] text-muted">
                  Bypasses all agent logic and sweeps the full vault balance to the
                  Master EOA. The nuclear option when something is wrong and funds must
                  leave immediately.
                </p>

                {/* Scrambled text detail */}
                <div className="mb-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                  <ScrambledText
                    radius={80}
                    duration={0.8}
                    speed={0.4}
                    scrambleChars="0123456789abcdef"
                    className="!m-0 !max-w-none !text-xs"
                  >
                    emergencyWithdraw(to) -&gt; sweep all -&gt; Master EOA receives funds
                  </ScrambledText>
                </div>

                {/* Footer note */}
                <div className="rounded-xl bg-surface-2/50 p-3">
                  <p className="font-mono text-xs text-faint">
                    Irreversible sweep. Requires Master Key signature + confirmation.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
