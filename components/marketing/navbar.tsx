"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MetallicLogo } from "@/components/ui/metallic-logo";

/**
 * Floating pill navbar.
 * - Full-width + transparent at rest.
 * - Shrinks into a centered blurred capsule on scroll.
 * - Center-aligned nav links, CTA right.
 */

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "https://github.com", label: "GitHub" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] flex justify-center transition-all duration-700 ease-[var(--ease-out-expo)] ${
        scrolled ? "pt-3 sm:pt-5" : "pt-4 sm:pt-6"
      }`}
    >
      <nav
        className={`flex items-center justify-between transition-all duration-700 ease-[var(--ease-out-expo)] ${
          scrolled
            ? "w-[95%] sm:w-[92%] max-w-5xl bg-bg/80 backdrop-blur-2xl px-4 sm:px-6 py-3 sm:py-3.5 rounded-full border border-border shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]"
            : "w-full max-w-7xl px-5 sm:px-8 py-3 bg-transparent border border-transparent"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group z-20" aria-label="Home">
          <span className="group-hover:scale-105 transition-transform duration-500 origin-left">
            <MetallicLogo size={24} />
          </span>
          <span className="text-base sm:text-lg font-semibold tracking-[-0.03em] text-text">
            Castle
          </span>
        </Link>

        {/* Center links - absolutely positioned for true centering */}
        <div className="hidden md:flex items-center gap-1 z-10 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[13px] font-medium text-muted hover:text-text transition-all duration-300 px-5 py-2.5 rounded-full hover:bg-white/[0.04]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3 z-20">
          <Link
            href="/dashboard"
            className="group relative flex items-center justify-center text-[12px] sm:text-[13px] font-medium bg-accent text-bg px-4 sm:px-6 py-2 sm:py-2.5 rounded-full hover:bg-accent-hover hover:scale-105 transition-all duration-500 ease-[var(--ease-out-expo)]"
          >
            <span className="relative z-10">Get started</span>
            <div className="absolute inset-0 rounded-full bg-accent opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-500" />
          </Link>

          {/* Mobile hamburger */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {mobileOpen ? (
                <><path d="M4 4l8 8" /><path d="M12 4l-8 8" /></>
              ) : (
                <><path d="M2 5h12" /><path d="M2 11h12" /></>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 mx-4 rounded-2xl border border-border bg-bg/95 backdrop-blur-2xl p-4 md:hidden shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-muted hover:text-text px-4 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
