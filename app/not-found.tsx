"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import DecryptedText from "@/components/reactbits/text/DecryptedText";

// Background - lazy loaded (WebGL)
const Lightning = dynamic(
  () => import("@/components/reactbits/backgrounds/Lightning"),
  { ssr: false }
);

/**
 * 404 page - uses Lightning (bg), DecryptedText.
 * Environment Layer allowed here (isolated, non-competing, yields to focus).
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Lightning background - violet themed */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <Lightning
          hue={260}
          speed={1.5}
          intensity={1.2}
          size={1}
        />
      </div>

      <div className="relative z-10 text-center">
        <p className="font-mono text-8xl font-bold text-accent/20">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-text">
          <DecryptedText
            text="Page not found"
            className="text-text"
            encryptedClassName="text-accent/60"
            animateOn="view"
            speed={60}
            sequential={true}
          />
        </h1>
        <p className="mt-2 text-sm text-muted">
          The route you requested does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-sm bg-accent px-5 text-sm font-medium text-bg transition-all hover:bg-accent-hover active:scale-[0.97]"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
