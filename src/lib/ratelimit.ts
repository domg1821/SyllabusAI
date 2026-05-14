import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ─── Redis singleton ───────────────────────────────────────────────────────────
// Redis constructor is cheap (no network call), so module-level init is fine.
// All limiter instances share the same client to avoid redundant connections.

const configured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

// ─── Limiter factory ───────────────────────────────────────────────────────────

type Duration = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

function makeLimiter(
  requests: number,
  window: Duration,
  prefix: string
): Ratelimit | null {
  if (!configured) return null;
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix,
  });
}

// ─── Named limiters ────────────────────────────────────────────────────────────
// null when UPSTASH_* env vars are absent — all checks pass through (local dev).

export const limiters = {
  // /api/analyze — authenticated
  analyzeHourly: makeLimiter(10, "1 h", "rl:analyze:hourly"),
  analyzeDaily:  makeLimiter(50, "1 d", "rl:analyze:daily"),
  // /api/analyze — unauthenticated (IP-based)
  analyzeIp:     makeLimiter(3, "1 h", "rl:analyze:ip"),
  // /api/practice-test — authenticated
  practiceTest:  makeLimiter(20, "1 h", "rl:practice"),
  // /api/upload — authenticated
  upload:        makeLimiter(30, "1 h", "rl:upload"),
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Calls limiter.limit(identifier). Returns { blocked: false } when the
 * limiter is null (Upstash not configured) so the route continues normally.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ blocked: false } | { blocked: true; reset: number }> {
  if (!limiter) return { blocked: false };
  const { success, reset } = await limiter.limit(identifier);
  return success ? { blocked: false } : { blocked: true, reset };
}

/** Builds a 429 response with Retry-After and a user-readable message. */
export function tooManyRequests(
  reset: number,
  window: "hour" | "day"
): NextResponse {
  const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  const timeStr =
    retryAfterSec < 60
      ? `${retryAfterSec} second${retryAfterSec !== 1 ? "s" : ""}`
      : `${Math.ceil(retryAfterSec / 60)} minute${Math.ceil(retryAfterSec / 60) !== 1 ? "s" : ""}`;

  return NextResponse.json(
    {
      error: `Too many requests — you've reached the ${window}ly limit. Please try again in ${timeStr}.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
      },
    }
  );
}

/** Extracts the most-specific client IP from the request headers. */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
