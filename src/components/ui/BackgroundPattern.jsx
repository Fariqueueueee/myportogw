function BackgroundPattern({
  variant = 'dots',
  density = 'regular',
  className = '',
}) {
  const itemCount = density === 'compact' ? 28 : density === 'wide' ? 18 : 22

  return (
    <div
      className={`background-pattern background-pattern--${variant} background-pattern--${density} ${className}`.trim()}
      aria-hidden="true"
    >
      {Array.from({ length: itemCount }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  )
}

export default BackgroundPattern
