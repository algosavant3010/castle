"use client";

import { ViewTransition } from "react";

/**
 * PageTransition - wraps page content with React ViewTransition for smooth
 * page change animations. Responds to navigation direction types set on Links.
 *
 * Usage: Wrap page content in <PageTransition> to get automatic enter/exit
 * animations during route changes.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "page-enter",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "page-exit",
      }}
    >
      {children}
    </ViewTransition>
  );
}
