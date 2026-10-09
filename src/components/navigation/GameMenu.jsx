import MenuItem from './MenuItem.jsx'
import NavigationHint from './NavigationHint.jsx'

function GameMenu({ items, activeId, selectedIndex, isTransitioning, onActivate, onSelect }) {
  const selectedItem = items[selectedIndex]

  return (
    <aside
      className={`game-menu-panel${isTransitioning ? ' is-transitioning' : ''}`}
      aria-busy={isTransitioning}
    >
      <div className="game-menu-panel__header">
        <p className="graphic-label">Choose destination</p>
        <span>{String(selectedIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
      </div>

      <nav className="game-menu" aria-label="Portfolio sections">
        <ol>
          {items.map((item, index) => (
            <MenuItem
              key={item.id}
              item={item}
              index={index}
              isActive={activeId === item.id}
              isSelected={selectedIndex === index}
              onActivate={onActivate}
              onSelect={onSelect}
            />
          ))}
        </ol>
      </nav>

      <p className="sr-only" aria-live="polite">
        Selected {selectedItem.label}. {selectedItem.descriptor}.
      </p>
      <NavigationHint />
    </aside>
  )
}

export default GameMenu
