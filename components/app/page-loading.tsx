"use client";

import { CastleLoader } from "@/components/app/castle-loader";

/**
 * PageLoading - shown during Suspense boundaries.
 * Displays the metallic animated castle logo centered on screen.
 */
export function PageLoading() {
  return <CastleLoader />;
}
