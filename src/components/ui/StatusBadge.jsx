function StatusBadge({ label, tone = 'red', className = '' }) {
  return (
    <span className={`status-badge status-badge--${tone} ${className}`.trim()}>
      <span className="status-badge__mark" aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}

export default StatusBadge
