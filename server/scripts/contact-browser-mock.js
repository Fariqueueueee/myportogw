import { createApp } from '../src/app.js'
import { EmailServiceUnavailableError } from '../src/contact/email.service.js'

const host = '127.0.0.1'
const port = 3001
let requestCount = 0

const mockEmailService = Object.freeze({
  provider: 'browser-test-mock',

  async sendContact(contact) {
    requestCount += 1
    console.log(`Mock contact request count: ${requestCount}`)

    if (contact.message.includes('[mock:reject]')) {
      return { accepted: false }
    }

    if (contact.message.includes('[mock:unavailable]')) {
      throw new EmailServiceUnavailableError()
    }

    if (contact.message.includes('[mock:slow]')) {
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    return { accepted: true }
  },
})

const app = createApp({
  frontendOrigin: 'http://127.0.0.1:4173',
  emailService: mockEmailService,
  rateLimitMax: 100,
  logger: { error: () => console.error('Mock API encountered an unexpected error.') },
})

const server = app.listen(port, host, () => {
  console.log(`Mock Contact API listening on http://${host}:${port}`)
  console.log('This fixture never contacts Resend or another email provider.')
})

function shutdown() {
  server.close(() => process.exit(0))
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
