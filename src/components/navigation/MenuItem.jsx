function MenuItem({ item, index, isActive, isSelected, onActivate, onSelect }) {
  return (
    <li className="game-menu__entry">
      <button
        className={`menu-item${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
        type="button"
        aria-current={isActive ? 'page' : undefined}
        onClick={() => {
          onSelect(index)
          onActivate(item.id)
        }}
        onFocus={() => onSelect(index)}
      >
        <span className="menu-item__number" aria-hidden="true">{item.number}</span>
        <span className="menu-item__content">
          <strong>{item.label}</strong>
          <small>{item.descriptor}</small>
        </span>
        <span className="menu-item__indicator" aria-hidden="true">
          <i />
          Select
        </span>
      </button>
    </li>
  )
}

export default MenuItem
