import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ContactApiError, submitContact } from '../src/services/contactApi.js'

const payload = Object.freeze({
  name: 'Test Visitor',
  email: 'visitor@example.com',
  message: 'A safe test message.',
})

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

test('contact API submits JSON and accepts only a valid 200 response', async () => {
  let request
  const result = await submitContact(payload, {
    async fetchImpl(url, options) {
      request = { url, options }
      return jsonResponse(200, { success: true, message: 'Accepted.' })
    },
  })

  assert.equal(request.url, '/api/contact')
  assert.equal(request.options.method, 'POST')
  assert.equal(request.options.headers['Content-Type'], 'application/json')
  assert.deepEqual(JSON.parse(request.options.body), payload)
  assert.deepEqual(result, { accepted: true, message: 'Accepted.' })
})

test('contact API preserves server field errors for HTTP 400', async () => {
  await assert.rejects(
    submitContact(payload, {
      fetchImpl: async () => jsonResponse(400, {
        success: false,
        errors: { email: 'Enter a valid email address.' },
      }),
    }),
    (error) => {
      assert.ok(error instanceof ContactApiError)
      assert.equal(error.code, 'validation')
      assert.deepEqual(error.fieldErrors, { email: 'Enter a valid email address.' })
      return true
    },
  )
})

test('contact API reads Retry-After for HTTP 429', async () => {
  await assert.rejects(
    submitContact(payload, {
      fetchImpl: async () => jsonResponse(429, { success: false }, { 'Retry-After': '75' }),
    }),
    (error) => {
      assert.equal(error.code, 'rate_limited')
      assert.equal(error.retryAfterSeconds, 75)
      return true
    },
  )
})

for (const [status, code] of [[403, 'origin_rejected'], [413, 'request_too_large'], [415, 'unsupported_media_type'], [500, 'server_error'], [502, 'provider_rejected'], [503, 'unavailable']]) {
  test(`contact API maps HTTP ${status} to ${code}`, async () => {
    await assert.rejects(
      submitContact(payload, {
        fetchImpl: async () => jsonResponse(status, { success: false }),
      }),
      (error) => error instanceof ContactApiError && error.code === code,
    )
  })
}

test('contact API reports network failures without provider details', async () => {
  await assert.rejects(
    submitContact(payload, {
      async fetchImpl() {
        throw new Error('private connection detail')
      },
    }),
    (error) => {
      assert.equal(error.code, 'network')
      assert.equal(error.ambiguous, true)
      assert.doesNotMatch(error.message, /private connection detail/u)
      return true
    },
  )
})

test('contact API aborts and marks a timeout as ambiguous', async () => {
  const request = submitContact(payload, {
    timeoutMs: 10,
    fetchImpl(url, { signal }) {
      assert.equal(url, '/api/contact')
      return new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        }, { once: true })
      })
    },
  })

  await assert.rejects(request, (error) => {
    assert.equal(error.code, 'timeout')
    assert.equal(error.ambiguous, true)
    return true
  })
})

test('contact API distinguishes caller cancellation from timeout', async () => {
  const controller = new AbortController()
  const request = submitContact(payload, {
    signal: controller.signal,
    fetchImpl(url, { signal }) {
      return new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        }, { once: true })
      })
    },
  })

  controller.abort()
  await assert.rejects(request, (error) => error.code === 'aborted' && !error.ambiguous)
})
