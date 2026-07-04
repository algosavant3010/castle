"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// All remaining backgrounds - lazy loaded, client only
const Aurora = dynamic(() => import("@/components/reactbits/backgrounds/Aurora"), { ssr: false });
const Beams = dynamic(() => import("@/components/reactbits/backgrounds/Beams"), { ssr: false });
const DarkVeil = dynamic(() => import("@/components/reactbits/backgrounds/DarkVeil"), { ssr: false });
const FaultyTerminal = dynamic(() => import("@/components/reactbits/backgrounds/FaultyTerminal"), { ssr: false });
const LetterGlitch = dynamic(() => import("@/components/reactbits/backgrounds/LetterGlitch"), { ssr: false });

/**
 * /settings/backgrounds - Environment Layer preview
 *
 * Showcases all installed background components with violet theme tuning.
 * These are the Environment Layer options available for specific surfaces
 * (connect, 404, interstitials) per FRONTEND_PLAN.md Section 2.
 */

const BACKGROUNDS = [
  { name: "Aurora", description: "Flowing aurora gradient, violet hue" },
  { name: "Beams", description: "Crossing animated ribbons" },
  { name: "DarkVeil", description: "Subtle dark veil with postprocessing" },
  { name: "FaultyTerminal", description: "CRT terminal scanlines, security aesthetic" },
  { name: "LetterGlitch", description: "Matrix-style letter animation" },
];

export default function BackgroundsPage() {
  const [active, setActive] = useState("Aurora");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-text">
          Background Components
        </h1>
        <p className="mt-1 text-sm text-muted">
          Environment Layer previews. These are opt-in for specific surfaces only.
        </p>
      </div>

      {/* Selector */}
      <div className="flex flex-wrap gap-2">
        {BACKGROUNDS.map((bg) => (
          <button
            key={bg.name}
            onClick={() => setActive(bg.name)}
            className={`rounded-sm px-3 py-1.5 text-xs transition-colors ${
              active === bg.name
                ? "bg-accent-soft text-accent"
                : "bg-surface text-muted hover:text-text"
            }`}
          >
            {bg.name}
          </button>
        ))}
      </div>

      {/* Preview area */}
      <div className="relative h-[400px] overflow-hidden rounded-sm border border-border">
        {active === "Aurora" && (
          <Aurora speed={0.5} colorStops={["#836EF9", "#5B45D6", "#08080A"]} amplitude={1.2} />
        )}
        {active === "Beams" && (
          <Beams
            beamWidth={2}
            beamNumber={6}
            lightColor="#836EF9"
            speed={1}
          />
        )}
        {active === "DarkVeil" && (
          <DarkVeil />
        )}
        {active === "FaultyTerminal" && (
          <FaultyTerminal
            timeScale={1.5}
          />
        )}
        {active === "LetterGlitch" && (
          <LetterGlitch
            glitchSpeed={50}
            glitchColors={["#836EF9", "#5B45D6", "#08080A"]}
            centerVignette={true}
            outerVignette={true}
            smooth={true}
            characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"
          />
        )}

        {/* Overlay label */}
        <div className="absolute bottom-4 left-4 z-10 rounded-sm bg-bg/80 px-3 py-1.5 backdrop-blur-sm">
          <p className="text-xs font-medium text-text">{active}</p>
          <p className="text-[10px] text-faint">
            {BACKGROUNDS.find((b) => b.name === active)?.description}
          </p>
        </div>
      </div>

      {/* Usage rules */}
      <div className="rounded-sm border border-border bg-surface p-5">
        <h3 className="mb-2 text-sm font-medium text-text">Environment Layer rules</h3>
        <ul className="space-y-1 text-xs text-muted">
          <li>Never behind the hero or simulation artifact</li>
          <li>Allowed only on non-competing surfaces (connect, 404, interstitials)</li>
          <li>Tune to violet hue only, opacity capped at ~0.35</li>
          <li>Must yield GPU resources when scrolled off / tab hidden</li>
          <li>Must degrade to static frame under prefers-reduced-motion</li>
        </ul>
      </div>
    </div>
  );
}
