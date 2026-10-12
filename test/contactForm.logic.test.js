import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  formatRetryAfter,
  mapServerFieldErrors,
  normalizeContactPayload,
  statusForContactError,
  validateContactValues,
} from '../src/sections/Contact/contactForm.logic.js'

test('client validation rejects empty and malformed contact values', () => {
  const errors = validateContactValues({
    name: '',
    email: 'invalid',
    tujuan: '',
    message: ' ',
  })

  assert.ok(errors.name)
  assert.ok(errors.email)
  assert.ok(errors.tujuan)
  assert.ok(errors.message)
})

test('contact payload normalization matches backend expectations', () => {
  assert.deepEqual(normalizeContactPayload({
    name: '  Test Visitor ',
    email: ' VISITOR@EXAMPLE.COM ',
    message: '  Hello. ',
  }), {
    name: 'Test Visitor',
    email: 'visitor@example.com',
    message: 'Hello.',
  })
})

test('server field error mapping ignores unknown request fields', () => {
  assert.deepEqual(mapServerFieldErrors({
    email: 'Invalid email.',
    request: 'Unexpected fields.',
    internal: 'Private detail.',
  }), { email: 'Invalid email.' })
})

test('rate-limit feedback includes a readable wait without a countdown', () => {
  assert.equal(formatRetryAfter(75), 'Try again in about 2 minutes.')
  assert.deepEqual(statusForContactError({ code: 'rate_limited', retryAfterSeconds: 75 }), {
    type: 'rate-limited',
    message: 'Too many attempts. Please try again later.',
    detail: 'Try again in about 2 minutes.',
  })
})

test('timeout feedback warns that retrying can duplicate an ambiguous request', () => {
  const status = statusForContactError({ code: 'timeout' })

  assert.equal(status.type, 'timeout')
  assert.match(status.detail, /might send a duplicate message/u)
})

test('provider rejection and unavailability use a safe unavailable state', () => {
  assert.equal(statusForContactError({ code: 'provider_rejected' }).type, 'unavailable')
  assert.equal(statusForContactError({ code: 'unavailable' }).type, 'unavailable')
})
