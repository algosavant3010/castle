"use client";

interface CastleIconProps {
  size?: number;
  className?: string;
  color?: string;
}

/** Static castle icon mark — the Blitz brand. */
export function CastleIcon({
  size = 28,
  className = "",
  color = "#836EF9",
}: CastleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Blitz"
      className={className}
    >
      <path
        d="M3 1V4L4.66667 5.66667L4.2 8H2V6H0V15H6V12C6 10.8954 6.89543 10 8 10C9.10457 10 10 10.8954 10 12V15H16V6H14V8H11.8L11.3333 5.66667L13 4V1H11V3H9V1H7V3H5V1H3Z"
        fill={color}
      />
    </svg>
  );
}

interface CastleLogoProps {
  iconSize?: number;
  className?: string;
}

/** Full lockup: castle icon + "Blitz" wordmark */
export function CastleLogo({
  iconSize = 24,
  className = "",
}: CastleLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CastleIcon size={iconSize} />
      <span className="text-lg font-semibold tracking-[-0.03em] text-text">
        Blitz
      </span>
    </div>
  );
}
