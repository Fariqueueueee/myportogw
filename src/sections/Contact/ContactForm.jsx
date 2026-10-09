import { useEffect, useRef, useState } from 'react'
import { submitContact } from '../../services/contactApi.js'
import {
  contactLimits,
  emptyContactValues,
  idleContactStatus,
  mapServerFieldErrors,
  normalizeContactPayload,
  statusForContactError,
  validateContactField,
  validateContactValues,
} from './contactForm.logic.js'

const allFieldsTouched = Object.freeze({ name: true, email: true, message: true })

function ContactForm({ submitContactRequest = submitContact }) {
  const [values, setValues] = useState({ ...emptyContactValues })
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(idleContactStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef(null)
  const mountedRef = useRef(true)
  const requestControllerRef = useRef(null)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      requestControllerRef.current?.abort()
    }
  }, [])

  const focusFirstInvalidField = (fieldErrors) => {
    const firstInvalidField = ['name', 'email', 'message']
      .find((fieldName) => fieldErrors[fieldName])

    if (firstInvalidField) {
      formRef.current?.elements.namedItem(firstInvalidField)?.focus()
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))

    if (touched[name]) {
      setErrors((current) => ({ ...current, [name]: validateContactField(name, value) }))
    }

    if (!isSubmittingRef.current && status.type !== 'idle') {
      setStatus(idleContactStatus)
    }
  }

  const handleBlur = (event) => {
    const { name, value } = event.target
    setTouched((current) => ({ ...current, [name]: true }))
    setErrors((current) => ({ ...current, [name]: validateContactField(name, value) }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // React state updates are asynchronous; the ref closes the same-tick duplicate window.
    if (isSubmittingRef.current) return

    const nextErrors = validateContactValues(values)
    const hasErrors = Object.values(nextErrors).some(Boolean)

    setTouched(allFieldsTouched)
    setErrors(nextErrors)

    if (hasErrors) {
      setStatus({ type: 'validation', message: 'Please check the highlighted fields.' })
      focusFirstInvalidField(nextErrors)
      return
    }

    const submittedPayload = normalizeContactPayload(values)
    const submittedSignature = JSON.stringify(submittedPayload)
    const controller = new AbortController()

    isSubmittingRef.current = true
    requestControllerRef.current = controller
    setIsSubmitting(true)
    setStatus({ type: 'submitting', message: 'Sending your message...' })

    try {
      await submitContactRequest(submittedPayload, { signal: controller.signal })
      if (!mountedRef.current) return

      setErrors({})
      setTouched({})
      setValues((current) => (
        JSON.stringify(normalizeContactPayload(current)) === submittedSignature
          ? { ...emptyContactValues }
          : current
      ))
      setStatus({ type: 'accepted', message: 'Your message was accepted for delivery.' })
    } catch (error) {
      if (!mountedRef.current || error?.code === 'aborted') return

      if (error?.code === 'validation') {
        const serverFieldErrors = mapServerFieldErrors(error.fieldErrors)
        setErrors((current) => ({ ...current, ...serverFieldErrors }))
        setTouched((current) => ({
          ...current,
          ...Object.fromEntries(Object.keys(serverFieldErrors).map((field) => [field, true])),
        }))
        setStatus(statusForContactError(error))
        focusFirstInvalidField(serverFieldErrors)
      } else {
        setStatus(statusForContactError(error))
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
      isSubmittingRef.current = false
      if (mountedRef.current) setIsSubmitting(false)
    }
  }

  const fieldDescription = (name, hintId) => {
    const ids = [hintId]
    if (errors[name]) ids.push(`${name}-error`)
    return ids.join(' ')
  }

  return (
    <form
      className="contact-form"
      noValidate
      onSubmit={handleSubmit}
      aria-busy={isSubmitting}
      ref={formRef}
    >
      <div className="contact-form__heading">
        <div>
          <p className="graphic-label">Secure API channel</p>
          <h2>Start the signal.</h2>
        </div>
        <span aria-hidden="true">05</span>
      </div>

      <div className="contact-field">
        <label htmlFor="contact-name">Full name <span aria-hidden="true">*</span></label>
        <input
          id="contact-name"
          name="name"
          type="text"
          value={values.name}
          maxLength={contactLimits.name}
          autoComplete="name"
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={fieldDescription('name', 'name-hint')}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <div className="contact-field__meta">
          <span id="name-hint">Up to {contactLimits.name} characters</span>
          <span>{values.name.length}/{contactLimits.name}</span>
        </div>
        {errors.name && <p className="contact-field__error" id="name-error">{errors.name}</p>}
      </div>

      <div className="contact-field">
        <label htmlFor="contact-email">Email <span aria-hidden="true">*</span></label>
        <input
          id="contact-email"
          name="email"
          type="email"
          value={values.email}
          maxLength={contactLimits.email}
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={fieldDescription('email', 'email-hint')}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <div className="contact-field__meta">
          <span id="email-hint">Use an address where a reply can reach you</span>
          <span>{values.email.length}/{contactLimits.email}</span>
        </div>
        {errors.email && <p className="contact-field__error" id="email-error">{errors.email}</p>}
      </div>

      <div className="contact-field">
        <label htmlFor="contact-message">Message <span aria-hidden="true">*</span></label>
        <textarea
          id="contact-message"
          name="message"
          value={values.message}
          maxLength={contactLimits.message}
          rows="7"
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={fieldDescription('message', 'message-hint')}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <div className="contact-field__meta">
          <span id="message-hint">Share the project, opportunity, or idea</span>
          <span>{values.message.length}/{contactLimits.message}</span>
        </div>
        {errors.message && <p className="contact-field__error" id="message-error">{errors.message}</p>}
      </div>

      <button className="contact-form__submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? 'Sending...' : 'Send message'}</span>
        <span aria-hidden="true">{isSubmitting ? '...' : '→'}</span>
      </button>

      <div
        className={`contact-form__status contact-form__status--${status.type}`}
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        <p>{status.message}</p>
        {status.detail && <p className="contact-form__status-detail">{status.detail}</p>}
      </div>
    </form>
  )
}

export default ContactForm
