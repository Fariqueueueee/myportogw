import assert from 'node:assert/strict'
import { once } from 'node:events'
import { afterEach, test } from 'node:test'
import { createApp } from '../src/app.js'

const frontendOrigin = 'http://127.0.0.1:4173'
const openServers = new Set()
const acceptedEmailService = {
  provider: 'test',
  async sendContact() {
    return { accepted: true }
  },
}

afterEach(async () => {
  await Promise.all([...openServers].map((server) => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })))
  openServers.clear()
})

async function startTestServer(options = {}) {
  const app = createApp({
    frontendOrigin,
    logger: { error() {} },
    rateLimitMax: 100,
    ...options,
  })
  const server = app.listen(0, '127.0.0.1')
  openServers.add(server)
  await once(server, 'listening')

  const address = server.address()
  return `http://127.0.0.1:${address.port}`
}

function validPayload(overrides = {}) {
  return {
    name: 'Visitor Name',
    email: 'visitor@example.com',
    message: 'Hello, I would like to discuss a project.',
    ...overrides,
  }
}

async function postContact(baseUrl, payload, options = {}) {
  return fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  })
}

test('health endpoint returns a minimal response and security headers', async () => {
  const baseUrl = await startTestServer()
  const response = await fetch(`${baseUrl}/api/health`)

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { success: true, status: 'ok' })
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(
    response.headers.get('content-security-policy'),
    "default-src 'none'; frame-ancestors 'none'",
  )
  assert.equal(
    response.headers.get('permissions-policy'),
    'camera=(), geolocation=(), microphone=()',
  )
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('x-frame-options'), 'DENY')
  assert.equal(response.headers.get('x-powered-by'), null)
})

test('valid normalized input returns 200 only after injected adapter acceptance', async () => {
  let receivedContact = null
  const baseUrl = await startTestServer({
    emailService: {
      async sendContact(contact) {
        receivedContact = contact
        return { accepted: true }
      },
    },
  })

  const response = await postContact(baseUrl, {
    name: '  Visitor Name  ',
    email: '  VISITOR@example.com ',
    message: '  Hello from the test suite.  ',
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    success: true,
    message: 'Your message has been accepted for delivery.',
  })
  assert.deepEqual(receivedContact, {
    name: 'Visitor Name',
    email: 'visitor@example.com',
    message: 'Hello from the test suite.',
  })
})

test('default mock adapter never reports successful delivery', async () => {
  const baseUrl = await startTestServer()
  const response = await postContact(baseUrl, validPayload())

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    success: false,
    message: 'Email service is currently unavailable.',
  })
})

test('missing and malformed fields return predictable validation errors', async () => {
  const baseUrl = await startTestServer({ emailService: acceptedEmailService })
  const response = await postContact(baseUrl, {
    name: '',
    email: 'not-an-email',
    message: 42,
  })
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.equal(body.success, false)
  assert.equal(body.message, 'Invalid contact information.')
  assert.equal(body.errors.name, 'Name is required.')
  assert.equal(body.errors.email, 'Enter a valid email address.')
  assert.equal(body.errors.message, 'Message must be text.')
})

test('nested values and unexpected fields are rejected', async () => {
  const baseUrl = await startTestServer({ emailService: acceptedEmailService })
  const response = await postContact(baseUrl, {
    ...validPayload(),
    name: { value: 'Nested' },
    admin: true,
  })
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.equal(body.errors.name, 'Name must be text.')
  assert.equal(body.errors.request, 'Request contains unexpected fields.')
})

test('malformed JSON returns 400 without exposing parser details', async () => {
  const baseUrl = await startTestServer({ emailService: acceptedEmailService })
  const response = await postContact(baseUrl, '{"name":')

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    success: false,
    message: 'Malformed JSON request.',
  })
})

test('unsupported content types return 415', async () => {
  const baseUrl = await startTestServer({ emailService: acceptedEmailService })
  const response = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'not json',
  })

  assert.equal(response.status, 415)
  assert.deepEqual(await response.json(), {
    success: false,
    message: 'Content-Type must be application/json.',
  })
})

test('request bodies over 8kb return 413', async () => {
  const baseUrl = await startTestServer({ emailService: acceptedEmailService })
  const response = await postContact(baseUrl, validPayload({ message: 'x'.repeat(9 * 1024) }))

  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), {
    success: false,
    message: 'Request body too large.',
  })
})

test('allowed origins receive exact CORS headers and preflight support', async () => {
  const baseUrl = await startTestServer({ emailService: acceptedEmailService })
  const response = await fetch(`${baseUrl}/api/contact`, {
    method: 'OPTIONS',
    headers: {
      Origin: frontendOrigin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type',
    },
  })

  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), frontendOrigin)
  assert.match(response.headers.get('access-control-allow-methods'), /POST/u)
  assert.match(response.headers.get('vary'), /Origin/u)
})

test('disallowed browser origins are rejected without CORS permission', async () => {
  const baseUrl = await startTestServer({ emailService: acceptedEmailService })
  const response = await postContact(baseUrl, validPayload(), {
    headers: { Origin: 'https://attacker.example' },
  })

  assert.equal(response.status, 403)
  assert.equal(response.headers.get('access-control-allow-origin'), null)
  assert.deepEqual(await response.json(), {
    success: false,
    message: 'Origin is not allowed.',
  })
})

test('rate limiting returns 429 and Retry-After after the configured maximum', async () => {
  const baseUrl = await startTestServer({
    emailService: acceptedEmailService,
    rateLimitMax: 2,
    rateLimitWindowMs: 60_000,
    rateLimitKeyGenerator: () => 'test-client',
  })

  const firstResponse = await postContact(baseUrl, validPayload())
  const secondResponse = await postContact(baseUrl, validPayload())
  const blockedResponse = await postContact(baseUrl, validPayload())

  assert.equal(firstResponse.status, 200)
  assert.equal(secondResponse.status, 200)
  assert.equal(blockedResponse.status, 429)
  assert.ok(Number(blockedResponse.headers.get('retry-after')) > 0)
  assert.deepEqual(await blockedResponse.json(), {
    success: false,
    message: 'Too many requests. Please try again later.',
  })
})

test('rate limiting counts malformed and oversized attempts before parsing', async () => {
  const baseUrl = await startTestServer({
    emailService: acceptedEmailService,
    rateLimitMax: 2,
    rateLimitWindowMs: 60_000,
    rateLimitKeyGenerator: () => 'parser-abuse-client',
  })

  const malformedResponse = await postContact(baseUrl, '{"name":')
  const oversizedResponse = await postContact(
    baseUrl,
    validPayload({ message: 'x'.repeat(9 * 1024) }),
  )
  const blockedResponse = await postContact(baseUrl, validPayload())

  assert.equal(malformedResponse.status, 400)
  assert.equal(oversizedResponse.status, 413)
  assert.equal(blockedResponse.status, 429)
})

test('adapter non-acceptance returns a safe 502 response', async () => {
  const baseUrl = await startTestServer({
    emailService: {
      async sendContact() {
        return { accepted: false, providerResponse: 'private provider detail' }
      },
    },
  })
  const response = await postContact(baseUrl, validPayload())
  const responseText = await response.text()

  assert.equal(response.status, 502)
  assert.doesNotMatch(responseText, /private provider detail/u)
  assert.deepEqual(JSON.parse(responseText), {
    success: false,
    message: 'Email service did not accept the message.',
  })
})

test('unexpected adapter failures return 500 without stack or error details', async () => {
  const baseUrl = await startTestServer({
    emailService: {
      async sendContact() {
        throw new Error('secret internal provider failure')
      },
    },
  })
  const response = await postContact(baseUrl, validPayload())
  const responseText = await response.text()

  assert.equal(response.status, 500)
  assert.doesNotMatch(responseText, /secret|stack|provider failure/iu)
  assert.deepEqual(JSON.parse(responseText), {
    success: false,
    message: 'Unexpected server error.',
  })
})

test('unknown API routes return predictable JSON', async () => {
  const baseUrl = await startTestServer()
  const response = await fetch(`${baseUrl}/api/unknown`)

  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), {
    success: false,
    message: 'API route not found.',
  })
})
