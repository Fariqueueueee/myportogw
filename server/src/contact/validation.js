export const contactLimits = Object.freeze({
  name: 80,
  email: 254,
  message: 1200,
})

const allowedFields = new Set(Object.keys(contactLimits))
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u
const headerControlPattern = /[\u0000-\u001f\u007f]/u
const nullCharacterPattern = /\u0000/u

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function validateRequiredText(field, value, label, errors) {
  if (typeof value !== 'string') {
    errors[field] = `${label} must be text.`
    return null
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    errors[field] = `${label} is required.`
    return null
  }

  if (normalizedValue.length > contactLimits[field]) {
    errors[field] = `${label} must be ${contactLimits[field]} characters or fewer.`
    return null
  }

  return normalizedValue
}

export function validateContactPayload(payload) {
  const errors = {}

  if (!isPlainObject(payload)) {
    return {
      data: null,
      errors: { request: 'Request body must be a JSON object.' },
    }
  }

  const unexpectedFields = Object.keys(payload).filter((field) => !allowedFields.has(field))
  if (unexpectedFields.length > 0) {
    errors.request = 'Request contains unexpected fields.'
  }

  const name = validateRequiredText('name', payload.name, 'Name', errors)
  const email = validateRequiredText('email', payload.email, 'Email', errors)
  const message = validateRequiredText('message', payload.message, 'Message', errors)

  if (name && headerControlPattern.test(name)) {
    errors.name = 'Name contains unsupported control characters.'
  }

  if (email) {
    if (headerControlPattern.test(email) || !emailPattern.test(email)) {
      errors.email = 'Enter a valid email address.'
    }
  }

  if (message && nullCharacterPattern.test(message)) {
    errors.message = 'Message contains an unsupported character.'
  }

  if (Object.keys(errors).length > 0) {
    return { data: null, errors }
  }

  return {
    data: {
      name,
      email: email.toLowerCase(),
      message,
    },
    errors: null,
  }
}
