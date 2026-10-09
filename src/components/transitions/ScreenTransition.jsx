function ScreenTransition({ destination, phase, onCovered, onRevealed }) {
  const handleInkAnimationEnd = (event) => {
    if (phase === 'covering' && event.animationName === 'wipe-cover-ink') {
      onCovered()
    }
  }

  const handleRedAnimationEnd = (event) => {
    if (phase === 'revealing' && event.animationName === 'wipe-reveal-red') {
      onRevealed()
    }
  }

  return (
    <div
      className={`screen-transition screen-transition--${phase}`}
      data-phase={phase}
      aria-hidden="true"
    >
      <div
        className="screen-transition__panel screen-transition__panel--red"
        onAnimationEnd={handleRedAnimationEnd}
      />
      <div
        className="screen-transition__panel screen-transition__panel--ink"
        onAnimationEnd={handleInkAnimationEnd}
      />
      <div className="screen-transition__signal">
        <span>{destination.number}</span>
        <strong>{destination.label}</strong>
      </div>
    </div>
  )
}

export default ScreenTransition
