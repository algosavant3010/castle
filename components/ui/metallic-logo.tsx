"use client";

import MetallicPaint from "@/components/reactbits/effects/MetallicPaint";

interface MetallicLogoProps {
  /** Container width/height in px */
  size?: number;
  className?: string;
}

/**
 * Castle logo with a subtle liquid-metal shader effect.
 * Tuned for brand coherence: violet-dominant, low chromatic aberration,
 * restrained brightness so it reads as a polished emblem rather than
 * a flashy chrome blob. Designed for header/navbar placement.
 */
export function MetallicLogo({ size = 36, className = "" }: MetallicLogoProps) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <MetallicPaint
        imageSrc="/castle-metallic.svg"
        // Pattern - smooth, not too busy
        seed={42}
        scale={3}
        patternSharpness={0.7}
        noiseScale={0.3}
        // Animation - slow, elegant
        speed={0.15}
        liquid={0.35}
        mouseAnimation={false}
        // Visual - bright but controlled
        brightness={1.8}
        contrast={0.65}
        refraction={0.008}
        blur={0.018}
        chromaticSpread={0.6}
        fresnel={0.8}
        angle={0}
        waveAmplitude={0.6}
        distortion={0.4}
        contour={0.15}
        // Brand colors - violet-dominant, brighter highlights
        lightColor="#C4B8FF"
        darkColor="#1a1025"
        tintColor="#836EF9"
      />
    </div>
  );
}
