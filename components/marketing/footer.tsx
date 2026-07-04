"use client";

/**
 * Premium Footer
 * Multi-column layout with animated interactions, scroll-reveal entrance,
 * and brand-aligned atmospheric details. Uses ReactBits components for
 * polish: Magnet links, ShinyText tagline, DecryptedText brand.
 * TargetCursor effect for interactive hover targeting on footer links.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { CastleIcon } from "@/components/ui/blitz-logo";
import AnimatedContent from "@/components/reactbits/interactions/AnimatedContent";

import ShinyText from "@/components/reactbits/text/ShinyText";
import DecryptedText from "@/components/reactbits/text/DecryptedText";

const TargetCursor = dynamic(
  () => import("@/components/reactbits/interactions/TargetCursor"),
  { ssr: false }
);

const PRODUCT_LINKS = [
  { label: "AI Wallets", href: "/wallets" },
  { label: "Wallets", href: "/wallets" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Policies", href: "/policies" },
];

const RESOURCES_LINKS = [
  { label: "Documentation", href: "#" },
  { label: "GitHub", href: "https://github.com" },
  { label: "Security", href: "#" },
  { label: "Changelog", href: "#" },
];

const COMMUNITY_LINKS = [
  { label: "X / Twitter", href: "https://x.com" },
  { label: "Discord", href: "#" },
  { label: "Blog", href: "#" },
];

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-[13px] font-medium uppercase tracking-[0.04em] text-muted">
        {title}
      </span>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="footer-link text-sm text-faint transition-colors duration-[var(--dur-base)] hover:text-text"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <footer
      className="relative mt-24 border-t border-border overflow-hidden [&_*]:!cursor-none"
      style={{ cursor: isHovered ? "none" : undefined }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* TargetCursor - only visible when mouse is over footer */}
      {isHovered && (
        <TargetCursor
          targetSelector=".footer-link"
          spinDuration={2}
          hideDefaultCursor={false}
          parallaxOn={true}
          cursorColor="rgba(131, 110, 249, 0.7)"
          cursorColorOnTarget="#836ef9"
        />
      )}

      {/* Subtle accent glow at top border */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[2px] rounded-full opacity-60 blur-[2px] pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(131, 110, 249, 0.5), transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 md:px-12">
        {/* Main footer grid */}
        <AnimatedContent
          distance={20}
          direction="vertical"
          duration={0.6}
          ease="power3.out"
          threshold={0.1}
        >
          <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-12 md:gap-8 lg:py-20">
            {/* Brand column */}
            <div className="md:col-span-5 flex flex-col gap-5">
              <div className="flex items-center gap-2.5">
                <CastleIcon size={22} />
                <DecryptedText
                  text="Castle"
                  className="text-lg font-semibold tracking-[-0.03em] text-text"
                  encryptedClassName="text-lg font-semibold tracking-[-0.03em] text-accent"
                  speed={40}
                  animateOn="hover"
                  sequential
                  revealDirection="start"
                />
              </div>
              <p className="max-w-[280px] text-sm leading-relaxed text-faint">
                The trust layer for the agent economy. Let agents transact at the speed of Monad while you stay in control.
              </p>
              <ShinyText
                text="Built on Monad"
                speed={4}
                color="var(--text-faint)"
                shineColor="var(--accent)"
                className="mt-1 text-[13px] font-medium tracking-wide"
                spread={120}
              />
            </div>

            {/* Link columns */}
            <div className="md:col-span-7 grid grid-cols-2 gap-8 sm:grid-cols-3">
              <FooterLinkGroup title="Product" links={PRODUCT_LINKS} />
              <FooterLinkGroup title="Resources" links={RESOURCES_LINKS} />
              <FooterLinkGroup title="Community" links={COMMUNITY_LINKS} />
            </div>
          </div>
        </AnimatedContent>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border py-8 md:flex-row">
          <p className="text-xs text-faint">
            &copy; {new Date().getFullYear()} Castle. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="footer-link text-xs text-faint transition-colors duration-[var(--dur-base)] hover:text-muted"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="footer-link text-xs text-faint transition-colors duration-[var(--dur-base)] hover:text-muted"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
