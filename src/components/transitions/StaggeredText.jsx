function StaggeredText({
  as: Element = 'h1',
  lines,
  accentIndex = -1,
  className = '',
  ...props
}) {
  const accessibleText = lines.join(' ')

  return (
    <Element className={`staggered-text ${className}`.trim()} aria-label={accessibleText} {...props}>
      {lines.map((line, index) => {
        const Line = index === accentIndex ? 'strong' : 'span'

        return (
          <Line
            className="staggered-text__line"
            style={{ '--stagger-index': index }}
            aria-hidden="true"
            key={`${line}-${index}`}
          >
            {line}
          </Line>
        )
      })}
    </Element>
  )
}

export default StaggeredText
