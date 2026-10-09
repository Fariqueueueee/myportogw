import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createEmailService,
  createMockEmailService,
  createResendEmailService,
  EmailServiceUnavailableError,
  RESEND_EMAILS_ENDPOINT,
  RESEND_TEST_RECIPIENT,
  RESEND_TEST_SENDER,
} from '../src/contact/email.service.js'

const contact = Object.freeze({
  name: 'Visitor Name',
  email: 'visitor@example.com',
  message: 'I would like to discuss a project.',
})

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('Resend adapter sends the expected native fetch request and reports acceptance only', async () => {
  let capturedUrl
  let capturedOptions
  const service = createResendEmailService({
    apiKey: 'non-secret-test-value',
    async fetchImpl(url, options) {
      capturedUrl = url
      capturedOptions = options
      return jsonResponse(200, { id: 'email-test-id' })
    },
  })

  const result = await service.sendContact(contact)
  const payload = JSON.parse(capturedOptions.body)

  assert.equal(capturedUrl, RESEND_EMAILS_ENDPOINT)
  assert.equal(capturedOptions.method, 'POST')
  assert.equal(capturedOptions.headers['Content-Type'], 'application/json')
  assert.match(capturedOptions.headers.Authorization, /^Bearer /u)
  assert.equal(payload.from, RESEND_TEST_SENDER)
  assert.deepEqual(payload.to, [RESEND_TEST_RECIPIENT])
  assert.equal(payload.reply_to, contact.email)
  assert.match(payload.subject, /Visitor Name/u)
  assert.match(payload.text, /I would like to discuss a project\./u)
  assert.deepEqual(result, {
    accepted: true,
    provider: 'resend',
    providerMessageId: 'email-test-id',
    deliveryConfirmed: false,
  })
})

test('Resend adapter treats a provider rejection as non-acceptance without exposing details', async () => {
  const service = createResendEmailService({
    apiKey: 'non-secret-test-value',
    fetchImpl: async () => jsonResponse(422, { message: 'private provider detail' }),
  })

  const result = await service.sendContact(contact)

  assert.deepEqual(result, {
    accepted: false,
    provider: 'resend',
    deliveryConfirmed: false,
  })
  assert.doesNotMatch(JSON.stringify(result), /private provider detail/u)
})

test('Resend adapter rejects a success response that lacks an accepted message ID', async () => {
  const service = createResendEmailService({
    apiKey: 'non-secret-test-value',
    fetchImpl: async () => jsonResponse(200, { id: '' }),
  })

  assert.deepEqual(await service.sendContact(contact), {
    accepted: false,
    provider: 'resend',
    deliveryConfirmed: false,
  })
})

for (const status of [408, 429, 500, 503]) {
  test(`Resend adapter maps transient HTTP ${status} failures to service unavailable`, async () => {
    const service = createResendEmailService({
      apiKey: 'non-secret-test-value',
      fetchImpl: async () => jsonResponse(status, { message: 'provider unavailable' }),
    })

    await assert.rejects(
      service.sendContact(contact),
      EmailServiceUnavailableError,
    )
  })
}

test('Resend adapter maps network failures to a sanitized service error', async () => {
  const service = createResendEmailService({
    apiKey: 'non-secret-test-value',
    async fetchImpl() {
      throw new Error('sensitive network detail')
    },
  })

  await assert.rejects(service.sendContact(contact), (error) => {
    assert.ok(error instanceof EmailServiceUnavailableError)
    assert.doesNotMatch(error.message, /sensitive|network detail/iu)
    return true
  })
})

test('Resend adapter aborts a provider request after the configured timeout', async () => {
  let requestWasAborted = false
  const service = createResendEmailService({
    apiKey: 'non-secret-test-value',
    timeoutMs: 10,
    fetchImpl(url, { signal }) {
      assert.equal(url, RESEND_EMAILS_ENDPOINT)

      return new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => {
          requestWasAborted = true
          reject(new DOMException('The operation was aborted.', 'AbortError'))
        }, { once: true })
      })
    },
  })

  await assert.rejects(service.sendContact(contact), EmailServiceUnavailableError)
  assert.equal(requestWasAborted, true)
})

test('email service factory supports mock and resend while rejecting unknown providers', () => {
  assert.equal(createEmailService({ provider: 'mock' }).provider, 'mock')
  assert.equal(createEmailService({
    provider: 'resend',
    apiKey: 'non-secret-test-value',
    fetchImpl: async () => jsonResponse(200, { id: 'unused' }),
  }).provider, 'resend')
  assert.throws(
    () => createEmailService({ provider: 'smtp' }),
    /EMAIL_PROVIDER must be either/u,
  )
})

test('Resend adapter rejects missing credentials without echoing a credential value', () => {
  assert.throws(
    () => createResendEmailService(),
    /RESEND_API_KEY is required/u,
  )
})

test('existing mock adapter still never reports successful real delivery', async () => {
  await assert.rejects(
    createMockEmailService().sendContact(contact),
    EmailServiceUnavailableError,
  )
})
