"use client";

import BorderGlow from "@/components/reactbits/interactions/BorderGlow";
import { GLOW_PROPS } from "@/lib/ui";

/** The recurring Castle bolt glyph (1.5px stroke, 24px grid per BRAND.md). */
export function BoltMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

interface EmptyStateProps {
  /** Icon node rendered inside a circular container. Defaults to the bolt mark. */
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** Action element (button/link) rendered below the copy. */
  action?: React.ReactNode;
  /** Circle + icon color treatment. */
  tone?: "accent" | "muted";
  /** Wrap the state in a BorderGlow card. Defaults to true. */
  wrapped?: boolean;
  className?: string;
}

/**
 * Standard empty / zero-data state.
 * Centralizes the icon-in-circle + heading + copy + action pattern that
 * was duplicated across dashboard, wallets, marketplace, and activity.
 */
export function EmptyState({
  icon = <BoltMark />,
  title,
  description,
  action,
  tone = "accent",
  wrapped = true,
  className,
}: EmptyStateProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center px-4 py-12 text-center ${className ?? ""}`}>
      {icon && (
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
            tone === "accent" ? "bg-accent/10 text-accent" : "bg-white/[0.04] text-faint"
          }`}
        >
          {icon}
        </div>
      )}
      <h2 className="text-lg font-medium text-text">{title}</h2>
      {description && (
        <div className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</div>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );

  if (wrapped) {
    return <BorderGlow {...GLOW_PROPS}>{content}</BorderGlow>;
  }
  return content;
}
