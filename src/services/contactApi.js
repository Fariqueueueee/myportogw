const DEFAULT_TIMEOUT_MS = 10_000

const statusCodes = Object.freeze({
  400: 'validation',
  403: 'origin_rejected',
  413: 'request_too_large',
  415: 'unsupported_media_type',
  429: 'rate_limited',
  500: 'server_error',
  502: 'provider_rejected',
  503: 'unavailable',
})

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

async function parseJsonResponse(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function parseRetryAfter(value) {
  if (!value) return null

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds)

  const retryDate = Date.parse(value)
  if (Number.isNaN(retryDate)) return null

  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1000))
}

export class ContactApiError extends Error {
  constructor(message, {
    code,
    status = null,
    fieldErrors = null,
    retryAfterSeconds = null,
    ambiguous = false,
  }) {
    super(message)
    this.name = 'ContactApiError'
    this.code = code
    this.status = status
    this.fieldErrors = fieldErrors
    this.retryAfterSeconds = retryAfterSeconds
    this.ambiguous = ambiguous
  }
}

export async function submitContact(payload, {
  timeoutMs = DEFAULT_TIMEOUT_MS,
  signal,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError('Contact request timeout must be a positive integer.')
  }

  if (typeof fetchImpl !== 'function') {
    throw new TypeError('A fetch implementation is required.')
  }

  const controller = new AbortController()
  let timedOut = false

  const abortFromCaller = () => controller.abort(signal?.reason)
  if (signal?.aborted) {
    abortFromCaller()
  } else {
    signal?.addEventListener('abort', abortFromCaller, { once: true })
  }

  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetchImpl('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const body = await parseJsonResponse(response)

    if (response.status === 200 && body?.success === true) {
      return Object.freeze({ accepted: true, message: body.message })
    }

    const code = statusCodes[response.status] || 'http_error'
    const fieldErrors = code === 'validation' && isPlainObject(body?.errors)
      ? body.errors
      : null

    throw new ContactApiError('The contact request was not accepted.', {
      code,
      status: response.status,
      fieldErrors,
      retryAfterSeconds: code === 'rate_limited'
        ? parseRetryAfter(response.headers.get('Retry-After'))
        : null,
    })
  } catch (error) {
    if (error instanceof ContactApiError) throw error

    if (controller.signal.aborted) {
      if (timedOut) {
        throw new ContactApiError('The contact request timed out.', {
          code: 'timeout',
          ambiguous: true,
        })
      }

      throw new ContactApiError('The contact request was cancelled.', {
        code: 'aborted',
      })
    }

    throw new ContactApiError('The contact service could not be reached.', {
      code: 'network',
      ambiguous: true,
    })
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}
