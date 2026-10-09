function readPositiveInteger(value, fallback, label) {
  const parsedValue = Number(value)

  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    if (fallback !== undefined) return fallback
    throw new Error(`${label} must be a positive integer.`)
  }

  return parsedValue
}

export function createInMemoryRateLimiter({
  maxRequests = 5,
  windowMs = 15 * 60 * 1000,
  now = Date.now,
  keyGenerator = (request) => request.ip,
} = {}) {
  const normalizedMaxRequests = readPositiveInteger(maxRequests, undefined, 'Rate-limit maximum')
  const normalizedWindowMs = readPositiveInteger(windowMs, undefined, 'Rate-limit window')
  const attempts = new Map()
  let requestsSinceCleanup = 0

  function cleanupExpiredEntries(currentTime) {
    for (const [key, entry] of attempts) {
      if (entry.resetAt <= currentTime) attempts.delete(key)
    }
  }

  return function inMemoryRateLimit(request, response, next) {
    const currentTime = now()
    const key = String(keyGenerator(request) || 'unknown')
    const existingEntry = attempts.get(key)
    const entry = !existingEntry || existingEntry.resetAt <= currentTime
      ? { count: 0, resetAt: currentTime + normalizedWindowMs }
      : existingEntry

    entry.count += 1
    attempts.set(key, entry)

    requestsSinceCleanup += 1
    if (requestsSinceCleanup >= 100) {
      cleanupExpiredEntries(currentTime)
      requestsSinceCleanup = 0
    }

    const remaining = Math.max(0, normalizedMaxRequests - entry.count)
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000))

    response.set({
      'RateLimit-Limit': String(normalizedMaxRequests),
      'RateLimit-Remaining': String(remaining),
      'RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
    })

    if (entry.count > normalizedMaxRequests) {
      response.set('Retry-After', String(retryAfterSeconds))
      return response.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      })
    }

    return next()
  }
}
