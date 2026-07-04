/**
 * Shared UI constants for Castle.
 * Centralizes BorderGlow props and other reusable styling configs
 * so they aren't duplicated across every page file.
 */

/** Standard BorderGlow props used on all content cards */
export const GLOW_PROPS = {
  borderRadius: 20,
  backgroundColor: "#0c0c12",
  glowColor: "252 93 70",
  colors: ["#836ef9", "#9d8bff", "#38bdf8"] as string[],
  glowRadius: 30,
  edgeSensitivity: 40,
  glowIntensity: 0.8,
  coneSpread: 25,
  fillOpacity: 0.3,
} as const;
