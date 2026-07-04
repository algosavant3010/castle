"use client";

import Link from "next/link";
import BorderGlow from "@/components/reactbits/interactions/BorderGlow";
import { GLOW_PROPS } from "@/lib/ui";

interface StatCardProps {
  /** Uppercase label, e.g. "Total Balance" */
  label: string;
  /** Primary value — string or a live component (mono, tabular) */
  value: React.ReactNode;
  /** Small unit / caption under the value, e.g. "MON" */
  unit?: string;
  /** If set, the whole card becomes a link */
  href?: string;
  /** Extra classes on the outer wrapper (e.g. col-span) */
  className?: string;
}

/**
 * Standard dashboard metric card.
 * Centralizes the BorderGlow + label + mono value pattern that was
 * duplicated inline across dashboard and other pages.
 */
export function StatCard({ label, value, unit, href, className }: StatCardProps) {
  const inner = (
    <BorderGlow {...GLOW_PROPS}>
      <div
        className={`p-3.5 sm:p-5 transition-transform duration-150 ${
          href ? "cursor-pointer active:scale-[0.98]" : ""
        }`}
      >
        <p className="stat-label">{label}</p>
        <p className="stat-value mt-1.5 sm:mt-2">{value}</p>
        {unit && <p className="mt-0.5 text-[10px] sm:text-xs text-muted">{unit}</p>}
      </div>
    </BorderGlow>
  );

  if (href) {
    return (
      <Link href={href} className={`block ${className ?? ""}`}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
