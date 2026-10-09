const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmailAddress(value) {
  return typeof value === 'string' && emailPattern.test(value.trim())
}

export function isValidContactHref(href) {
  if (typeof href !== 'string' || !href.trim()) return false

  const normalizedHref = href.trim()

  if (normalizedHref.startsWith('mailto:')) {
    const emailAddress = normalizedHref.slice(7).split('?')[0]
    return isValidEmailAddress(emailAddress)
  }

  try {
    const url = new URL(normalizedHref)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
