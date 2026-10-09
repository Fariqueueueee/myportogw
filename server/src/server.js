import { createApp } from './app.js'
import { createEmailService } from './contact/email.service.js'

function readPositiveInteger(name, fallback) {
  const rawValue = process.env[name]
  if (rawValue === undefined || rawValue === '') return fallback

  const parsedValue = Number(rawValue)
  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }

  return parsedValue
}

function readServerConfig() {
  const emailProvider = (process.env.EMAIL_PROVIDER || 'mock').trim().toLowerCase()

  if (!['mock', 'resend'].includes(emailProvider)) {
    throw new Error('EMAIL_PROVIDER must be either "mock" or "resend".')
  }

  return {
    host: (process.env.HOST || '127.0.0.1').trim(),
    port: readPositiveInteger('PORT', 3001),
    frontendOrigin: process.env.FRONTEND_ORIGIN,
    rateLimitMax: readPositiveInteger('CONTACT_RATE_LIMIT_MAX', 5),
    rateLimitWindowMs: readPositiveInteger('CONTACT_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    emailProvider,
    resendApiKey: process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY,
    resendRequestTimeoutMs: readPositiveInteger('RESEND_REQUEST_TIMEOUT_MS', 10_000),
  }
}

const config = readServerConfig()
const emailService = createEmailService({
  provider: config.emailProvider,
  apiKey: config.resendApiKey,
  timeoutMs: config.resendRequestTimeoutMs,
})
const app = createApp({
  frontendOrigin: config.frontendOrigin,
  emailService,
  rateLimitMax: config.rateLimitMax,
  rateLimitWindowMs: config.rateLimitWindowMs,
})

const server = app.listen(config.port, config.host, () => {
  console.log(`Contact API listening on http://${config.host}:${config.port}`)
  console.log(`Email provider: ${config.emailProvider}`)
  console.log(
    config.emailProvider === 'resend'
      ? 'Successful provider responses indicate acceptance, not confirmed delivery.'
      : 'Mock mode is active; real email delivery is disabled.',
  )
})

function shutdown(signal) {
  console.log(`${signal} received; closing Contact API.`)
  server.close((error) => {
    if (error) {
      console.error('Contact API shutdown failed.')
      process.exitCode = 1
    }
  })
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
