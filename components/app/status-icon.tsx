"use client";

import { type SVGProps } from "react";

/**
 * Premium status indicator using distinct SVG shapes per state.
 * Follows Carbon Design System status-indicator pattern:
 * shape conveys meaning, color reinforces. Never color alone.
 *
 * Statuses:
 * - active:   Checkmark in circle — operational
 * - live:     Broadcast signal — actively running/streaming
 * - expiring: Clock with alert — approaching limit
 * - frozen:   Pause/lock — suspended
 * - expired:  Void circle — ended/inactive
 * - offline:  Disconnected — no connection
 * - open:     Open ring — available/pending
 * - released: Check badge — completed/released
 * - disputed: Warning triangle — requires attention
 */

export type StatusVariant =
  | "active"
  | "live"
  | "expiring"
  | "frozen"
  | "expired"
  | "offline"
  | "open"
  | "released"
  | "disputed";

interface StatusIconProps extends SVGProps<SVGSVGElement> {
  variant: StatusVariant;
  size?: number;
  /** Show a subtle pulse animation for live states */
  pulse?: boolean;
}

const colorMap: Record<StatusVariant, string> = {
  active: "text-safe",
  live: "text-safe",
  expiring: "text-warning",
  frozen: "text-danger",
  expired: "text-faint",
  offline: "text-faint",
  open: "text-accent",
  released: "text-safe",
  disputed: "text-danger",
};

/** Checkmark in circle — operational, healthy */
function ActiveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <circle cx="8" cy="8" r="4.5" fill="currentColor" opacity="0.15" />
      <path
        d="M5.5 8.2L7.1 9.8L10.5 6.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Broadcast/signal icon — actively streaming/running */
function LiveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="2.5" fill="currentColor" />
      <path
        d="M4.5 11.5a5 5 0 010-7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M11.5 4.5a5 5 0 010 7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M3 13a7 7 0 010-10"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M13 3a7 7 0 010 10"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}

/** Clock with alert — time running out */
function ExpiringIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <path
        d="M8 4.5V8.5L10.5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12.5" cy="3.5" r="2" fill="currentColor" opacity="0.8" />
      <path
        d="M12.5 2.5V3.8"
        stroke="var(--bg, #08080a)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="4.3" r="0.4" fill="var(--bg, #08080a)" />
    </svg>
  );
}

/** Pause/lock icon — frozen/suspended */
function FrozenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <rect x="2.5" y="2.5" width="11" height="11" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <rect x="5.5" y="5" width="1.8" height="6" rx="0.9" fill="currentColor" />
      <rect x="8.7" y="5" width="1.8" height="6" rx="0.9" fill="currentColor" />
    </svg>
  );
}

/** Void circle — expired/ended */
function ExpiredIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <path
        d="M5.5 5.5L10.5 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10.5 5.5L5.5 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Disconnected signal — offline */
function OfflineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.5" />
      <path
        d="M5 11a4.5 4.5 0 010-6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M11 5a4.5 4.5 0 010 6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Slash through */}
      <path
        d="M3 13L13 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

/** Open ring — available/pending */
function OpenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** Check badge — released/completed */
function ReleasedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M8 1.5l1.6 1.2 2-.2.6 1.9 1.7 1.1-.4 2L14.6 8l-1.1 1.5.4 2-1.7 1.1-.6 1.9-2-.2L8 15.5l-1.6-1.2-2 .2-.6-1.9-1.7-1.1.4-2L1.4 8l1.1-1.5-.4-2 1.7-1.1.6-1.9 2 .2L8 1.5z"
        fill="currentColor"
        opacity="0.15"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M5.8 8.2L7.2 9.6L10.2 6.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Warning triangle — disputed/attention */
function DisputedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M8 2L14.5 13H1.5L8 2z"
        fill="currentColor"
        opacity="0.12"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M8 6.5V9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.2" r="0.7" fill="currentColor" />
    </svg>
  );
}

const iconMap: Record<StatusVariant, React.FC<SVGProps<SVGSVGElement>>> = {
  active: ActiveIcon,
  live: LiveIcon,
  expiring: ExpiringIcon,
  frozen: FrozenIcon,
  expired: ExpiredIcon,
  offline: OfflineIcon,
  open: OpenIcon,
  released: ReleasedIcon,
  disputed: DisputedIcon,
};

export function StatusIcon({ variant, size = 14, pulse, className, ...props }: StatusIconProps) {
  const Icon = iconMap[variant];
  const color = colorMap[variant];

  return (
    <span className={`relative inline-flex shrink-0 ${color} ${className ?? ""}`}>
      {pulse && (
        <span
          className="absolute inset-0 animate-ping opacity-30 rounded-full"
          style={{ animationDuration: "2s" }}
        />
      )}
      <Icon width={size} height={size} {...props} />
    </span>
  );
}

/**
 * Status chip: icon + label in a contained pill.
 * Replaces the old pattern of `<span class="chip"><dot/>label</span>`
 */
interface StatusChipProps {
  variant: StatusVariant;
  label?: string;
  size?: number;
  pulse?: boolean;
  className?: string;
}

const chipBgMap: Record<StatusVariant, string> = {
  active: "bg-safe/10 text-safe",
  live: "bg-safe/10 text-safe",
  expiring: "bg-warning/10 text-warning",
  frozen: "bg-danger/10 text-danger",
  expired: "bg-white/[0.04] text-faint",
  offline: "bg-white/[0.04] text-faint",
  open: "bg-accent/10 text-accent",
  released: "bg-safe/10 text-safe",
  disputed: "bg-danger/10 text-danger",
};

export function StatusChip({ variant, label, size = 12, pulse, className }: StatusChipProps) {
  const displayLabel = label ?? variant;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${chipBgMap[variant]} ${className ?? ""}`}
    >
      <StatusIcon variant={variant} size={size} pulse={pulse} />
      {displayLabel}
    </span>
  );
}
