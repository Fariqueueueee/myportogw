import { useRef, useState } from 'react'
import {
  contactLimits,
  emptyContactValues,
  idleContactStatus,
  validateContactField,
  validateContactValues,
} from './contactForm.logic.js'

const allFieldsTouched = Object.freeze({
  name: true,
  email: true,
  tujuan: true,
  message: true,
})

function ContactForm() {
  const [values, setValues] = useState({ ...emptyContactValues })
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(idleContactStatus)
  const formRef = useRef(null)

  const focusFirstInvalidField = (fieldErrors) => {
    const firstInvalidField = ['name', 'email', 'tujuan', 'message']
      .find((fieldName) => fieldErrors[fieldName])

    if (firstInvalidField) {
      formRef.current?.elements.namedItem(firstInvalidField)?.focus()
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))

    if (touched[name]) {
      setErrors((current) => ({
        ...current,
        [name]: validateContactField(name, value),
      }))
    }

    if (status.type !== 'idle') {
      setStatus(idleContactStatus)
    }
  }

  const handleBlur = (event) => {
    const { name, value } = event.target
    setTouched((current) => ({ ...current, [name]: true }))
    setErrors((current) => ({
      ...current,
      [name]: validateContactField(name, value),
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = validateContactValues(values)
    const hasErrors = Object.values(nextErrors).some(Boolean)

    setTouched(allFieldsTouched)
    setErrors(nextErrors)

    if (hasErrors) {
      setStatus({
        type: 'validation',
        message: 'Silakan periksa kembali data yang diisi.',
      })
      focusFirstInvalidField(nextErrors)
      return
    }

    const noWA = '6285111341621'
    const teks = `Halo, saya *${values.name.trim()}*.
Tujuan saya ingin *${values.tujuan.trim()}*.

Isi pesan:
_${values.message.trim()}_

Email saya: *${values.email.trim()}*`
    const url = `https://wa.me/${noWA}?text=${encodeURIComponent(teks)}`

    window.open(url, '_blank', 'noopener,noreferrer')
    setStatus({
      type: 'accepted',
      message: 'Pesan WhatsApp sudah dibuka. Silakan periksa lalu kirim pesannya.',
    })
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
      ref={formRef}
    >
      <div className="contact-form__heading">
        <div>
          <p className="graphic-label">WhatsApp channel</p>
          <h2>Start Contact Me</h2>
        </div>
        <span aria-hidden="true">05</span>
      </div>

      <div className="contact-field">
        <label htmlFor="contact-name">Nama lengkap <span aria-hidden="true">*</span></label>
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
          <span id="name-hint">Maksimal {contactLimits.name} karakter</span>
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
          <span id="email-hint">Gunakan email yang bisa dihubungi</span>
          <span>{values.email.length}/{contactLimits.email}</span>
        </div>
        {errors.email && <p className="contact-field__error" id="email-error">{errors.email}</p>}
      </div>

      <div className="contact-field">
        <label htmlFor="contact-purpose">Tujuan <span aria-hidden="true">*</span></label>
        <input
          id="contact-purpose"
          name="tujuan"
          type="text"
          value={values.tujuan}
          maxLength={contactLimits.tujuan}
          required
          aria-invalid={Boolean(errors.tujuan)}
          aria-describedby={fieldDescription('tujuan', 'tujuan-hint')}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <div className="contact-field__meta">
          <span id="tujuan-hint">Contoh: kerja sama atau pembuatan website</span>
          <span>{values.tujuan.length}/{contactLimits.tujuan}</span>
        </div>
        {errors.tujuan && (
          <p className="contact-field__error" id="tujuan-error">{errors.tujuan}</p>
        )}
      </div>

      <div className="contact-field">
        <label htmlFor="contact-message">Pesan <span aria-hidden="true">*</span></label>
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
          <span id="message-hint">Jelaskan proyek, peluang, atau idemu</span>
          <span>{values.message.length}/{contactLimits.message}</span>
        </div>
        {errors.message && (
          <p className="contact-field__error" id="message-error">{errors.message}</p>
        )}
      </div>

      <button className="contact-form__submit" type="submit">
        <span>Kirim lewat WhatsApp</span>
        <span aria-hidden="true">→</span>
      </button>

      <div
        className={`contact-form__status contact-form__status--${status.type}`}
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        <p>{status.message}</p>
      </div>
    </form>
  )
}

export default ContactForm
