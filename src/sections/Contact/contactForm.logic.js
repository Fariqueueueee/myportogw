import { isValidEmailAddress } from '../../utils/links.js'

export const contactLimits = Object.freeze({
  name: 80,
  email: 254,
  tujuan: 120,
  message: 1200,
})

export const emptyContactValues = Object.freeze({
  name: '',
  email: '',
  tujuan: '',
  message: '',
})

export const idleContactStatus = Object.freeze({
  type: 'idle',
  message: 'Have something in mind? Send a message.',
})

export function validateContactField(name, value) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    if (name === 'name') return 'Masukkan nama kamu.'
    if (name === 'email') return 'Masukkan alamat email.'
    if (name === 'tujuan') return 'Masukkan tujuan menghubungi.'
    return 'Masukkan pesan sebelum mengirim.'
  }

  if (value.length > contactLimits[name]) {
    const labels = {
      name: 'Nama',
      email: 'Email',
      tujuan: 'Tujuan',
      message: 'Pesan',
    }
    return `${labels[name]} maksimal ${contactLimits[name]} karakter.`
  }

  if (name === 'email' && !isValidEmailAddress(trimmedValue)) {
    return 'Masukkan email dengan format seperti nama@contoh.com.'
  }

  return ''
}

export function validateContactValues(values) {
  return {
    name: validateContactField('name', values.name),
    email: validateContactField('email', values.email),
    tujuan: validateContactField('tujuan', values.tujuan),
    message: validateContactField('message', values.message),
  }
}

export function normalizeContactPayload(values) {
  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    message: values.message.trim(),
  }
}

export function mapServerFieldErrors(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return {}

  return ['name', 'email', 'message'].reduce((mappedErrors, field) => {
    if (typeof fieldErrors[field] === 'string' && fieldErrors[field]) {
      mappedErrors[field] = fieldErrors[field]
    }
    return mappedErrors
  }, {})
}

export function formatRetryAfter(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return null
  if (seconds < 60) return `Try again in about ${Math.max(1, Math.ceil(seconds))} seconds.`

  const minutes = Math.ceil(seconds / 60)
  return `Try again in about ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`
}

export function statusForContactError(error) {
  if (error?.code === 'validation') {
    return { type: 'validation', message: 'Please check the highlighted fields.' }
  }

  if (error?.code === 'rate_limited') {
    return {
      type: 'rate-limited',
      message: 'Too many attempts. Please try again later.',
      detail: formatRetryAfter(error.retryAfterSeconds),
    }
  }

  if (error?.code === 'network') {
    return { type: 'network', message: 'Unable to connect to the contact service.' }
  }

  if (error?.code === 'timeout') {
    return {
      type: 'timeout',
      message: 'The submission status could not be confirmed.',
      detail: 'The request timed out. Retrying might send a duplicate message.',
    }
  }

  if (error?.code === 'origin_rejected') {
    return { type: 'unavailable', message: 'The contact request was rejected by the server.' }
  }

  if (error?.code === 'request_too_large') {
    return { type: 'validation', message: 'The message is too large to submit.' }
  }

  if (error?.code === 'unsupported_media_type') {
    return { type: 'unavailable', message: 'The contact service could not process this request.' }
  }

  return { type: 'unavailable', message: 'The contact service is temporarily unavailable.' }
}
