export function notFoundHandler(request, response) {
  response.status(404).json({
    success: false,
    message: 'API route not found.',
  })
}

export function createErrorHandler({ logger = console } = {}) {
  return function errorHandler(error, request, response, next) {
    if (response.headersSent) return next(error)

    if (error?.type === 'entity.too.large') {
      return response.status(413).json({
        success: false,
        message: 'Request body too large.',
      })
    }

    if (error?.type === 'entity.parse.failed') {
      return response.status(400).json({
        success: false,
        message: 'Malformed JSON request.',
      })
    }

    logger.error?.('Unhandled contact API error.', {
      errorName: typeof error?.name === 'string' ? error.name : 'Error',
    })

    return response.status(500).json({
      success: false,
      message: 'Unexpected server error.',
    })
  }
}
