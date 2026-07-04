"use client";

import { useState, useCallback } from "react";
import DecryptedText from "@/components/reactbits/text/DecryptedText";

interface CopyButtonProps {
  /** The text content to copy to clipboard */
  value: string;
  /** Label shown before clicking */
  label?: string;
  /** Label shown after copy succeeds */
  copiedLabel?: string;
  /** Visual variant */
  variant?: "ghost" | "inline";
  className?: string;
}

/**
 * CopyButton - A satisfying copy-to-clipboard button with:
 * - Scale press animation for tactile feedback
 * - DecryptedText scramble effect on state change
 * - Brief "Copied!" confirmation that auto-resets
 */
export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied!",
  variant = "inline",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setKey((k) => k + 1);
      setTimeout(() => {
        setCopied(false);
        setKey((k) => k + 1);
      }, 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setKey((k) => k + 1);
      setTimeout(() => {
        setCopied(false);
        setKey((k) => k + 1);
      }, 2000);
    }
  }, [value]);

  const baseStyles =
    variant === "ghost"
      ? "btn btn-ghost inline-flex items-center gap-2"
      : "inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-150 active:scale-90";

  const colorStyles = copied
    ? "text-safe"
    : variant === "inline"
      ? "text-accent hover:text-accent-hover"
      : "";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${baseStyles} ${colorStyles} ${className} cursor-pointer select-none active:scale-[0.92] transition-transform duration-100`}
    >
      {/* Icon */}
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className={`h-3.5 w-3.5 shrink-0 transition-all duration-200 ${copied ? "scale-110" : ""}`}
      >
        {copied ? (
          <path
            d="M4 8.5l2.5 2.5L12 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <>
            <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        )}
      </svg>

      {/* Scramble text effect */}
      <DecryptedText
        key={key}
        text={copied ? copiedLabel : label}
        speed={30}
        maxIterations={6}
        sequential
        revealDirection="start"
        animateOn="view"
        characters="!@#$%^&*_+"
        className="opacity-100"
        encryptedClassName="opacity-40"
      />
    </button>
  );
}
