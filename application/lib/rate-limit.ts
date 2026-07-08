interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 60 * 60 * 1000) {
        store.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + windowMs,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.windowStart + windowMs,
  };
}

export const Limits = {
  createAnalysis: (userId: string) =>
    checkRateLimit({
      key: `analysis:create:${userId}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    }),

  personaCrud: (userId: string) =>
    checkRateLimit({
      key: `persona:crud:${userId}`,
      limit: 30,
      windowMs: 60 * 1000,
    }),

  internalCrawlComplete: (analysisId: string) =>
    checkRateLimit({
      key: `internal:crawl-complete:${analysisId}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    }),
} as const;
