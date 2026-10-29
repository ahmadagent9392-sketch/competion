/*
 * Best-effort per-client rate limit (sliding window, in memory).
 * On serverless hosts each instance keeps its own counters, so this is a brake against casual abuse and
 * runaway loops, not a hard guarantee. It exists mainly to protect the AI key from being used up.
 */

const buckets = new Map<string, number[]>();
const MAX_KEYS = 5000;

export const RATE_LIMIT_PER_MIN = (() => {
  const n = Number(process.env.RATE_LIMIT_PER_MIN);
  return Number.isFinite(n) && n >= 1 && n <= 600 ? Math.floor(n) : 20;
})();

export function rateLimit(key: string, limit = RATE_LIMIT_PER_MIN, windowMs = 60_000, now = Date.now()): { ok: boolean; retryAfter: number } {
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - hits[0])) / 1000)) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return { ok: true, retryAfter: 0 };
}

/** Identify the caller from proxy headers (Vercel sets x-forwarded-for to the real client IP). */
export function clientKey(req: Request, scope: string): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "local";
  return `${scope}:${ip}`;
}

export const RATE_LIMITED_MESSAGE = "Too many requests. Please wait a minute and try again.";
