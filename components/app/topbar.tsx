"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CastleIcon } from "@/components/ui/castle-logo";
import GooeyNav from "@/components/app/GooeyNav";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Wallets", href: "/wallets" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Activity", href: "/activity" },
  { label: "Settings", href: "/settings" },
];

export function Topbar() {
  return (
    <header className="sticky top-0 z-50 flex h-12 md:h-14 items-center justify-between border-b border-white/[0.04] bg-bg/50 backdrop-blur-md px-4 md:px-6 overflow-visible">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80">
        <CastleIcon size={20} />
        <span className="text-[13px] md:text-sm font-semibold tracking-tight text-text/90">Castle</span>
      </Link>

      {/* Right-aligned nav using GooeyNav */}
      <div className="hidden md:flex items-center ml-auto">
        <GooeyNav
          items={NAV_ITEMS}
          particleCount={0}
          particleDistances={[70, 8]}
          particleR={80}
          initialActiveIndex={0}
          animationTime={400}
          timeVariance={200}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />
      </div>

      {/* Mobile nav — bottom bar */}
      <MobileNav />
    </header>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/[0.04] bg-[#08080a]/95 backdrop-blur-xl py-1.5 px-1 safe-bottom md:hidden">
        {[
          { href: "/dashboard", label: "Home", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
          { href: "/wallets", label: "Wallets", icon: "M12 2a2 2 0 012 2v1h3a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h3V4a2 2 0 012-2zM9 12h.01M15 12h.01" },
          { href: "/marketplace", label: "Market", icon: "M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM3 9l2.45-4.9A2 2 0 017.24 3h9.52a2 2 0 011.79 1.1L21 9" },
          { href: "/activity", label: "Activity", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
          { href: "/settings", label: "Settings", icon: "M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2zM12 15a3 3 0 100-6 3 3 0 000 6z" },
        ].map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-colors ${
                isActive ? "text-accent" : "text-faint active:text-accent"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={link.icon} />
              </svg>
              <span className="text-[9px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
