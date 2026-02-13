/**
 * Simple in-memory rate limiter for Next.js middleware.
 *
 * Uses a sliding window approach with automatic cleanup.
 * Note: In-memory state is per-instance. On Vercel with multiple
 * serverless functions, each instance has its own store. This provides
 * reasonable protection without external dependencies.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}

/**
 * Check rate limit for a given key (e.g. IP address + path prefix).
 *
 * @param key - Unique identifier (e.g. "192.168.1.1:/helfer")
 * @param limit - Max requests per window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed, remaining, resetAt }
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  entry.count++

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  }
}
