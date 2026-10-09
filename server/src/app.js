import express from 'express'
import { createContactRouter } from './contact/contact.routes.js'
import { createMockEmailService } from './contact/email.service.js'
import { createCorsMiddleware } from './middleware/cors.js'
import { createErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { createInMemoryRateLimiter } from './middleware/rateLimit.js'

const DEFAULT_BODY_LIMIT = '8kb'

export function createApp({
  frontendOrigin,
  emailService = createMockEmailService(),
  rateLimitMax = 5,
  rateLimitWindowMs = 15 * 60 * 1000,
  rateLimitKeyGenerator,
  logger = console,
} = {}) {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', false)

  app.use((request, response, next) => {
    response.set({
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    })
    next()
  })

  app.use(createCorsMiddleware({ allowedOrigin: frontendOrigin }))
  const rateLimiter = createInMemoryRateLimiter({
    maxRequests: rateLimitMax,
    windowMs: rateLimitWindowMs,
    keyGenerator: rateLimitKeyGenerator,
  })

  // Count every contact attempt, including malformed and oversized bodies.
  app.use('/api/contact', rateLimiter)
  app.use(express.json({ limit: DEFAULT_BODY_LIMIT, strict: true }))

  app.get('/api/health', (request, response) => {
    response.status(200).json({ success: true, status: 'ok' })
  })

  app.use('/api/contact', createContactRouter({ emailService }))
  app.use(notFoundHandler)
  app.use(createErrorHandler({ logger }))

  return app
}
