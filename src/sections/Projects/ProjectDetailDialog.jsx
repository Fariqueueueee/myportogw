import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { isValidContactHref } from '../../utils/links.js'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function ProjectDetailDialog({ project, onClose }) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const root = document.getElementById('root')
    const previousOverflow = document.body.style.overflow
    const rootWasInert = root?.hasAttribute('inert') ?? false

    document.body.style.overflow = 'hidden'
    root?.setAttribute('inert', '')
    closeButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll(focusableSelector) ?? [],
      )

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = previousOverflow
      if (root && !rootWasInert) root.removeAttribute('inert')
    }
  }, [onClose])

  const titleId = `project-dialog-${project.id}`
  const descriptionId = `${titleId}-description`
  const projectLinks = [
    { href: project.github, label: 'GitHub' },
    { href: project.live, label: 'Live demo' },
  ].filter((link) => isValidContactHref(link.href))

  return createPortal(
    <div
      className="project-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="project-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={dialogRef}
        tabIndex="-1"
      >
        <button
          className="project-dialog__close"
          type="button"
          onClick={onClose}
          ref={closeButtonRef}
        >
          Close <span aria-hidden="true">×</span>
        </button>

        <div className="project-dialog__visual" aria-hidden="true">
          <span>Demo / {project.category}</span>
          <strong>{project.title}</strong>
          <i />
        </div>

        <div className="project-dialog__content">
          <p className="graphic-label">{project.status}</p>
          <h2 id={titleId}>{project.title}</h2>
          <p id={descriptionId}>{project.details}</p>

          <div className="project-dialog__stack">
            <span>Built with</span>
            <ul>
              {project.stack.map((technology) => <li key={technology}>{technology}</li>)}
            </ul>
          </div>

          {projectLinks.length > 0 ? (
            <div className="project-dialog__links">
              {projectLinks.map((link) => (
                <a href={link.href} target="_blank" rel="noreferrer" key={link.label}>
                  {link.label} ↗
                </a>
              ))}
            </div>
          ) : (
            <p className="project-dialog__notice">Demo content — public links not supplied.</p>
          )}
        </div>
      </section>
    </div>,
    document.body,
  )
}

export default ProjectDetailDialog
