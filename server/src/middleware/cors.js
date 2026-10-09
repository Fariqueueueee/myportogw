function normalizeOrigin(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('FRONTEND_ORIGIN is required.')
  }

  const origin = value.trim()
  const parsedOrigin = new URL(origin)

  if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.origin !== origin) {
    throw new Error('FRONTEND_ORIGIN must be an exact HTTP or HTTPS origin without a path.')
  }

  return origin
}

export function createCorsMiddleware({ allowedOrigin }) {
  const normalizedOrigin = normalizeOrigin(allowedOrigin)

  return function exactOriginCors(request, response, next) {
    const requestOrigin = request.get('Origin')

    response.vary('Origin')

    if (requestOrigin && requestOrigin !== normalizedOrigin) {
      return response.status(403).json({
        success: false,
        message: 'Origin is not allowed.',
      })
    }

    if (requestOrigin === normalizedOrigin) {
      response.set({
        'Access-Control-Allow-Origin': normalizedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
      })
    }

    if (request.method === 'OPTIONS') {
      return response.status(204).end()
    }

    return next()
  }
}
