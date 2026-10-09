import { Router } from 'express'
import { EmailServiceUnavailableError } from './email.service.js'
import { validateContactPayload } from './validation.js'

export function createContactRouter({ emailService }) {
  if (!emailService || typeof emailService.sendContact !== 'function') {
    throw new Error('A contact email service is required.')
  }

  const router = Router()

  router.post('/', async (request, response, next) => {
    if (!request.is('application/json')) {
      return response.status(415).json({
        success: false,
        message: 'Content-Type must be application/json.',
      })
    }

    const { data, errors } = validateContactPayload(request.body)

    if (errors) {
      return response.status(400).json({
        success: false,
        message: 'Invalid contact information.',
        errors,
      })
    }

    try {
      const deliveryResult = await emailService.sendContact(data)

      if (deliveryResult?.accepted !== true) {
        return response.status(502).json({
          success: false,
          message: 'Email service did not accept the message.',
        })
      }

      return response.status(200).json({
        success: true,
        message: 'Your message has been accepted for delivery.',
      })
    } catch (error) {
      if (error instanceof EmailServiceUnavailableError) {
        return response.status(503).json({
          success: false,
          message: 'Email service is currently unavailable.',
        })
      }

      return next(error)
    }
  })

  return router
}
