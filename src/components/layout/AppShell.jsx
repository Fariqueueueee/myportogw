import BackgroundPattern from '../ui/BackgroundPattern.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

function AppShell({ activeItem, availability, children, isTransitioning, onHome }) {
  return (
    <div className={`app-shell portfolio-shell${isTransitioning ? ' is-transitioning' : ''}`}>
      <BackgroundPattern className="portfolio-shell__pattern" density="wide" />
      <span className="portfolio-shell__plane" aria-hidden="true" />
      <span className="portfolio-shell__slash portfolio-shell__slash--one" aria-hidden="true" />
      <span className="portfolio-shell__slash portfolio-shell__slash--two" aria-hidden="true" />

      <header className="portfolio-header content-container">
        <button className="brand-control" type="button" onClick={onHome}>
          <span className="brand-control__mark" aria-hidden="true" />
          <span>
            Rebel <i>/</i> Interface
          </span>
        </button>

        <div className="portfolio-header__state" aria-label={`Current section: ${activeItem.label}`}>
          <span>{activeItem.number}</span>
          <strong>{activeItem.label}</strong>
        </div>

        <StatusBadge className="portfolio-header__status" label={availability} tone="paper" />
      </header>

      {children}
    </div>
  )
}

export default AppShell
