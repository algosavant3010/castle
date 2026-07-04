"use client";

import { useEffect, useState } from "react";

/**
 * Global overlay that appears when MetaMask is waiting for user action.
 * Blurs the app and shows a prompt on the left side of the screen.
 * 
 * Uses a global event system — any component can trigger it via:
 *   window.dispatchEvent(new CustomEvent('blitz:tx-pending', { detail: true }))
 *   window.dispatchEvent(new CustomEvent('blitz:tx-pending', { detail: false }))
 */
export function TransactionOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setVisible(!!detail);
    };
    window.addEventListener("blitz:tx-pending", handler);
    return () => window.removeEventListener("blitz:tx-pending", handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ease-out" />

      {/* Left-side prompt (MetaMask usually opens on right) */}
      <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center">
        <div className="text-center space-y-4 animate-in slide-in-from-left-4 duration-500 ease-out">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 border border-accent/15">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent opacity-80">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">Action Required</h2>
            <p className="text-sm text-muted mt-1 max-w-xs mx-auto">
              Confirm the transaction in MetaMask to continue.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-faint">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent/60" />
            <span>Waiting for signature...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Call these from anywhere to show/hide the overlay.
 */
export function showTxOverlay() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("blitz:tx-pending", { detail: true }));
  }
}

export function hideTxOverlay() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("blitz:tx-pending", { detail: false }));
  }
}
