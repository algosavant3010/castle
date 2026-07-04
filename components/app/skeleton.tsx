/**
 * Inline shimmer skeleton. Uses the shared `.skeleton-pulse` keyframes
 * from globals.css so loading states feel finished instead of showing "...".
 */
export function Skeleton({
  width = "3rem",
  height = "1em",
  className,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton-pulse inline-block align-middle rounded-md ${className ?? ""}`}
      style={{ width, height }}
    />
  );
}
