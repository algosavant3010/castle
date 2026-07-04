import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.rateLimits.globalPerMinute,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down.', retryAfter: 60 },
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
});

const agentWindows = new Map<string, { timestamps: number[] }>();

export function agentRateLimiter(req: Request, res: Response, next: NextFunction) {
  const agentAddress = req.agentCredentials?.agentAddress;
  if (!agentAddress) return next();

  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = config.rateLimits.agentPerMinute;

  let entry = agentWindows.get(agentAddress);
  if (!entry) { entry = { timestamps: [] }; agentWindows.set(agentAddress, entry); }

  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
  if (entry.timestamps.length >= maxRequests) {
    const retryAfter = Math.ceil((entry.timestamps[0] + windowMs - now) / 1000);
    return res.status(429).json({ error: `Agent rate limit exceeded. Max ${maxRequests} req/min.`, retryAfter });
  }

  entry.timestamps.push(now);
  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', (maxRequests - entry.timestamps.length).toString());
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of agentWindows.entries()) {
    entry.timestamps = entry.timestamps.filter(t => now - t < 60_000);
    if (entry.timestamps.length === 0) agentWindows.delete(key);
  }
}, 300_000);
