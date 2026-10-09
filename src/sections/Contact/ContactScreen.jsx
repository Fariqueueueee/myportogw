import BackgroundPattern from '../../components/ui/BackgroundPattern.jsx'
import StaggeredText from '../../components/transitions/StaggeredText.jsx'
import { isValidContactHref, isValidEmailAddress } from '../../utils/links.js'
import ContactForm from './ContactForm.jsx'

function ContactScreen({ profile }) {
  const configuredEmail = isValidEmailAddress(profile.contactEmail)

  return (
    <section className="contact-screen" aria-labelledby="contact-title">
      <BackgroundPattern className="contact-screen__pattern" density="wide" />
      <span className="contact-screen__index" aria-hidden="true">05</span>

      <header className="contact-hero">
        <div className="contact-hero__copy">
        </div>
        <StaggeredText
          id="contact-title"
          className="contact-hero__title"
          lines={["Let's", 'talk']}
          accentIndex={1}
        />
      </header>

      <div className="contact-layout">
        <aside className="contact-details" aria-labelledby="contact-details-title">
          <div className="contact-details__heading">
            <p className="graphic-label">Contact information</p>
            <h2 id="contact-details-title">Choose a channel.</h2>
          </div>

          <div className="contact-method">
            <span>Email</span>
            {configuredEmail ? (
              <a href={`mailto:${profile.contactEmail.trim()}`}>{profile.contactEmail.trim()} ↗</a>
            ) : (
              <p aria-disabled="true">fariqarbia@gmail.com</p>
            )}
          </div>

          <ul className="contact-socials" aria-label="Social profiles">
            {profile.socialLinks.map((link, index) => (
              <li key={link.label}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {isValidContactHref(link.href) ? (
                  <a
                    href={link.href}
                    target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={link.href.startsWith('mailto:') ? undefined : 'noreferrer'}
                  >
                    {link.label} <i aria-hidden="true">↗</i>
                  </a>
                ) : (
                  <div aria-disabled="true">
                    <strong>{link.label}</strong>
                    <small>Link not configured</small>
                  </div>
                )}
              </li>
            ))}
          </ul>

        </aside>

        <ContactForm />
      </div>
    </section>
  )
}

export default ContactScreen
