import { NextResponse } from "next/server";

/**
 * Simple in-memory sliding window rate limiter.
 * Keyed by agent address (derived from auth token).
 * 
 * Limits: 60 requests per minute per agent key.
 */

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 300_000);

/**
 * Check rate limit for a given key (agent address).
 * Returns null if allowed, or a 429 NextResponse if rate limited.
 */
export function checkRateLimit(key: string): NextResponse | null {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.timestamps[0] + WINDOW_MS - now) / 1000);
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 60 requests per minute.", retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  entry.timestamps.push(now);
  return null;
}

/**
 * Get rate limit headers for successful responses.
 */
export function getRateLimitHeaders(key: string): Record<string, string> {
  const entry = store.get(key);
  const remaining = entry
    ? Math.max(0, MAX_REQUESTS - entry.timestamps.length)
    : MAX_REQUESTS;

  return {
    "X-RateLimit-Limit": MAX_REQUESTS.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.ceil((Date.now() + WINDOW_MS) / 1000).toString(),
  };
}
