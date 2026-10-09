function GraphicPanel({
  children,
  variant = 'ink',
  rotation = 'none',
  className = '',
  as: Element = 'article',
}) {
  const classes = [
    'graphic-panel',
    `graphic-panel--${variant}`,
    rotation !== 'none' ? `graphic-panel--rotate-${rotation}` : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <Element className={classes}>
      <div className="graphic-panel__surface">{children}</div>
    </Element>
  )
}

export default GraphicPanel
