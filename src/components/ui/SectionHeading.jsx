function SectionHeading({
  id,
  title,
  number,
  eyebrow,
  subtitle,
  theme = 'light',
  className = '',
}) {
  return (
    <header className={`section-heading section-heading--${theme} ${className}`.trim()}>
      <div className="section-heading__meta">
        {number && <span className="section-heading__number" aria-hidden="true">/{number}</span>}
        {eyebrow && <p className="graphic-label">{eyebrow}</p>}
      </div>
      <div className="section-heading__content">
        <h2 id={id} className="type-section-title">{title}</h2>
        {subtitle && <p className="section-heading__subtitle">{subtitle}</p>}
      </div>
      <span className="section-heading__accent" aria-hidden="true" />
    </header>
  )
}

export default SectionHeading
