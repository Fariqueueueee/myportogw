import BackgroundPattern from '../../components/ui/BackgroundPattern.jsx'
import RebelButton from '../../components/ui/RebelButton.jsx'
import StaggeredText from '../../components/transitions/StaggeredText.jsx'
import JourneyTimeline from './JourneyTimeline.jsx'

function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'RI'
}

function AboutScreen({ profile, content }) {
  return (
    <section className="about-screen" aria-labelledby="about-title">
      <BackgroundPattern className="about-screen__pattern" density="slashes" />
      <span className="about-screen__index" aria-hidden="true">04</span>

      <header className="about-hero">
        <div className="about-hero__copy">
        </div>
        <StaggeredText
          id="about-title"
          className="about-hero__title"
          lines={['About', 'me']}
          accentIndex={0}
        />
      </header>

      <section className="about-introduction" aria-labelledby="about-introduction-title">
        <div className="about-portrait">
          {content.profileImage ? (
            <img src={content.profileImage} alt={`${profile.name} portrait`} />
          ) : (
            <div className="about-portrait__placeholder" role="img" aria-label="Profile image not configured">
              <span>{getInitials(profile.name)}</span>
              <strong>Portrait slot</strong>
              <small>Image not configured</small>
              <i aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="about-introduction__content">
          <p className="graphic-label">Developer introduction</p>
          <h2 id="about-introduction-title">{profile.name}</h2>
          <div className="about-introduction__identity">
            <strong>{profile.role}</strong>
          </div>
          <p>{content.biography}</p>

          <div className="about-interests">
            <span>Primary interests</span>
            <ul>
              {content.interests.map((interest) => <li key={interest}>{interest}</li>)}
            </ul>
          </div>

          <blockquote>
            <span>philosophy</span>
            <p>“{content.philosophy}”</p>
          </blockquote>
        </div>
      </section>

      <section className="about-journey" aria-labelledby="about-journey-title">
        <div className="about-section-heading">
          <div>
            <h2 id="about-journey-title">Developer journey</h2>
          </div>
        </div>
        <JourneyTimeline entries={content.journey} />
      </section>

      <section className="about-principles" aria-labelledby="about-principles-title">
        <div className="about-section-heading">
          <div>
            <h2 id="about-principles-title">Personal approach</h2>
          </div>
        </div>
        <div className="about-principles__grid">
          {content.principles.map((principle) => (
            <article key={principle.number}>
              <span>{principle.number}</span>
              <h3>{principle.title}</h3>
              <p>{principle.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-cv" aria-labelledby="about-cv-title">
        <div>
          <p className="graphic-label">Curriculum vitae</p>
          <h2 id="about-cv-title">The formal version.</h2>
          <p>
            {content.cvPath
              ? 'Download the configured CV file.'
              : 'No CV file is configured. Add a real file path in src/data/about.js to enable this download.'}
          </p>
        </div>
        {content.cvPath ? (
          <RebelButton href={content.cvPath} download>Download CV</RebelButton>
        ) : (
          <RebelButton disabled aria-label="CV download unavailable">CV unavailable</RebelButton>
        )}
      </section>
    </section>
  )
}

export default AboutScreen
