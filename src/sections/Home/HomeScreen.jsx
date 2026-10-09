import BackgroundPattern from '../../components/ui/BackgroundPattern.jsx'
import GraphicPanel from '../../components/ui/GraphicPanel.jsx'
import RebelButton from '../../components/ui/RebelButton.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import StaggeredText from '../../components/transitions/StaggeredText.jsx'
import { isValidContactHref } from '../../utils/links.js'

function HomeScreen({ profile, onNavigate }) {
  return (
    <section className="home-screen" aria-labelledby="home-title">
      <BackgroundPattern className="home-screen__pattern" variant="slashes" density="compact" />
      <p className="home-screen__index" aria-hidden="true">01</p>

      <div className="home-screen__copy">
        <div className="home-screen__eyebrow">
          
        </div>

        <StaggeredText
          id="home-title"
          className="home-screen__headline"
          lines={profile.headlineLines}
          accentIndex={1}
        />

        <GraphicPanel variant="paper" rotation="left" className="home-screen__intro">
          <p className="graphic-label graphic-label--dark">Introduction</p>
          <p>{profile.introduction}</p>
        </GraphicPanel>

        <div className="home-screen__actions cluster">
          <RebelButton onClick={() => onNavigate('projects')}>View My Projects</RebelButton>
          <RebelButton variant="secondary" onClick={() => onNavigate('contact')}>
            Start a conversation
          </RebelButton>
        </div>
      </div>

      <footer className="home-screen__identity">
        <div className="identity-block">
          <span>Developer</span>
          <strong>{profile.name}</strong>
          <small>{profile.role}</small>
        </div>

        <div className="home-screen__meta">
          <p>{profile.locationLabel}</p>
          <ul aria-label="Social profile placeholders">
            {profile.socialLinks.map((link) => (
              <li key={link.label}>
                {isValidContactHref(link.href) ? (
                  <a
                    href={link.href}
                    target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={link.href.startsWith('mailto:') ? undefined : 'noreferrer'}
                  >
                    {link.label}
                  </a>
                ) : (
                  <span title="Add a URL in src/data/profile.js">{link.label} / add URL</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </section>
  )
}

export default HomeScreen
