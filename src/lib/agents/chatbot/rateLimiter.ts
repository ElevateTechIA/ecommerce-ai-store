/**
 * Rate Limiter
 *
 * Prevents abuse by limiting requests per identifier
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(identifier: string): RateLimitResult {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
    rateLimitStore.set(identifier, newEntry);

    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.count < MAX_REQUESTS_PER_WINDOW) {
    entry.count++;
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - entry.count,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
  };
}

export function getClientIdentifier(ip: string | undefined): string {
  return ip || 'unknown';
}
