/**
 * Ensures a minimum response time to prevent timing attacks on token lookups.
 * Wraps an async operation and pads the response time to a constant minimum.
 */
export async function withConstantTime<T>(
  operation: () => Promise<T>,
  minDelayMs = 200
): Promise<T> {
  const startTime = Date.now()
  const result = await operation()
  const elapsed = Date.now() - startTime

  if (elapsed < minDelayMs) {
    await new Promise((resolve) => setTimeout(resolve, minDelayMs - elapsed))
  }

  return result
}
