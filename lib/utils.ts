import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn - merge class names with Tailwind-aware conflict resolution.
 * Used by shadcn-style and React Bits components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
