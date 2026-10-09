export class EmailServiceUnavailableError extends Error {
  constructor() {
    super('Email service is unavailable.')
    this.name = 'EmailServiceUnavailableError'
  }
}

export const RESEND_EMAILS_ENDPOINT = 'https://api.resend.com/emails'
export const RESEND_TEST_SENDER = 'onboarding@resend.dev'
export const RESEND_TEST_RECIPIENT = 'delivered@resend.dev'

const DEFAULT_RESEND_TIMEOUT_MS = 10_000

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isTransientProviderStatus(status) {
  return status === 408 || status === 429 || status >= 500
}

async function readAcceptedMessageId(response) {
  try {
    const payload = await response.json()
    return isNonEmptyString(payload?.id) ? payload.id : null
  } catch {
    return null
  }
}

export function createMockEmailService() {
  return Object.freeze({
    provider: 'mock',

    async sendContact() {
      // Phase B must never imply that a real provider accepted a message.
      throw new EmailServiceUnavailableError()
    },
  })
}

export function createResendEmailService({
  apiKey,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_RESEND_TIMEOUT_MS,
} = {}) {
  if (!isNonEmptyString(apiKey)) {
    throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend.')
  }

  if (typeof fetchImpl !== 'function') {
    throw new Error('A fetch implementation is required for the Resend email service.')
  }

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('RESEND_REQUEST_TIMEOUT_MS must be a positive integer.')
  }

  const authorization = `Bearer ${apiKey.trim()}`

  return Object.freeze({
    provider: 'resend',

    async sendContact({ name, email, message }) {
      const abortController = new AbortController()
      const timeout = setTimeout(() => abortController.abort(), timeoutMs)

      try {
        const response = await fetchImpl(RESEND_EMAILS_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: RESEND_TEST_SENDER,
            to: [RESEND_TEST_RECIPIENT],
            reply_to: email,
            subject: `Portfolio enquiry from ${name}`,
            text: [
              `Name: ${name}`,
              `Reply email: ${email}`,
              '',
              message,
            ].join('\n'),
          }),
          signal: abortController.signal,
        })

        if (isTransientProviderStatus(response.status)) {
          throw new EmailServiceUnavailableError()
        }

        if (!response.ok) {
          return Object.freeze({
            accepted: false,
            provider: 'resend',
            deliveryConfirmed: false,
          })
        }

        const providerMessageId = await readAcceptedMessageId(response)

        if (!providerMessageId) {
          return Object.freeze({
            accepted: false,
            provider: 'resend',
            deliveryConfirmed: false,
          })
        }

        return Object.freeze({
          accepted: true,
          provider: 'resend',
          providerMessageId,
          // Resend acceptance is not proof that the message reached an inbox.
          deliveryConfirmed: false,
        })
      } catch (error) {
        if (error instanceof EmailServiceUnavailableError) {
          throw error
        }

        // Network and abort details stay internal and never reach API clients.
        throw new EmailServiceUnavailableError()
      } finally {
        clearTimeout(timeout)
      }
    },
  })
}

export function createEmailService({ provider = 'mock', ...options } = {}) {
  const normalizedProvider = String(provider).trim().toLowerCase()

  if (normalizedProvider === 'mock') {
    return createMockEmailService()
  }

  if (normalizedProvider === 'resend') {
    return createResendEmailService(options)
  }

  throw new Error('EMAIL_PROVIDER must be either "mock" or "resend".')
}
