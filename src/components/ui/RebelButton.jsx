function RebelButton({
  children,
  variant = 'primary',
  href,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const classes = `rebel-button rebel-button--${variant} ${className}`.trim()
  const content = (
    <>
      <span>{children}</span>
      <span className="rebel-button__arrow" aria-hidden="true">↗</span>
    </>
  )

  if (href) {
    const handleClick = (event) => {
      if (disabled) {
        event.preventDefault()
        return
      }

      onClick?.(event)
    }

    return (
      <a
        className={classes}
        href={disabled ? undefined : href}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={handleClick}
        {...props}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  )
}

export default RebelButton
