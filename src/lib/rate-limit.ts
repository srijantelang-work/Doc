/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Uses a Map of IP → timestamp arrays. Entries are pruned on each check
 * so memory stays bounded. Suitable for single-instance deployments
 * (SQLite apps, Docker containers). For multi-instance, swap in Redis.
 */

interface RateLimitConfig {
    /** Maximum number of requests allowed within the window. */
    maxRequests: number;
    /** Time window in milliseconds. */
    windowMs: number;
}

const store = new Map<string, number[]>();

/**
 * Check whether a request from `ip` is within the rate limit.
 *
 * @returns `true` if the request is allowed, `false` if rate-limited.
 */
export function checkRateLimit(ip: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing timestamps, filter out expired ones
    const timestamps = (store.get(ip) ?? []).filter((t) => t > windowStart);

    if (timestamps.length >= config.maxRequests) {
        store.set(ip, timestamps);
        return false; // rate-limited
    }

    timestamps.push(now);
    store.set(ip, timestamps);
    return true; // allowed
}

// ── Pre-configured limiters for each route ──────────────────────

/** Rate limit config for the /api/ask endpoint: 20 req / 60s */
export const ASK_RATE_LIMIT: RateLimitConfig = { maxRequests: 20, windowMs: 60_000 };

/** Rate limit config for the /api/documents POST endpoint: 10 req / 60s */
export const UPLOAD_RATE_LIMIT: RateLimitConfig = { maxRequests: 10, windowMs: 60_000 };

/**
 * Extract a client IP from a Next.js request.
 * Falls back to 'unknown' if headers are absent.
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();

    // Next.js doesn't expose remoteAddress on the Request object,
    // so in dev we fall back to a constant.
    return 'unknown';
}
