"use client";

import { MetallicLogo } from "@/components/ui/metallic-logo";

interface CastleLoaderProps {
  /** Use "inline" for smaller loading areas within cards/rows */
  variant?: "fullscreen" | "inline";
}

/**
 * CastleLoader - Loading state featuring the metallic animated castle logo.
 * No skeleton cards, no spinners, just the brand emblem in its liquid-metal glory.
 */
export function CastleLoader({ variant = "fullscreen" }: CastleLoaderProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center py-6">
        <MetallicLogo size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <MetallicLogo size={96} />
    </div>
  );
}
