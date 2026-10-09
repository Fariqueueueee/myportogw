import { useCallback, useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from './useReducedMotion.js'
import { useScreenTransition } from './useScreenTransition.js'

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false

  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  )
}

export function useMenuNavigation(items, initialId = 'home') {
  const initialIndex = Math.max(0, items.findIndex((item) => item.id === initialId))
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const reducedMotion = useReducedMotion()
  const itemIds = useMemo(() => items.map((item) => item.id), [items])

  const {
    focusRequest,
    handleCovered,
    handleRevealed,
    isTransitioning,
    phase,
    requestTransition,
    requestedId,
    visibleId,
  } = useScreenTransition({
    initialId: items[initialIndex]?.id,
    validIds: itemIds,
    reducedMotion,
  })

  const normalizeIndex = useCallback(
    (index) => ((index % items.length) + items.length) % items.length,
    [items.length],
  )

  const selectItem = useCallback(
    (index) => setSelectedIndex(normalizeIndex(index)),
    [normalizeIndex],
  )

  const activateSection = useCallback(
    (id) => {
      const nextIndex = items.findIndex((item) => item.id === id)
      if (nextIndex === -1) return

      setSelectedIndex(nextIndex)
      requestTransition(id)
    },
    [items, requestTransition],
  )

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (document.querySelector('[aria-modal="true"]')) return

      const isInsideForm = event.target instanceof HTMLElement && event.target.closest('form')

      if (isEditableTarget(event.target) || isInsideForm || event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      const interactiveTarget = event.target instanceof HTMLElement
        ? event.target.closest('a, button, input, textarea, select, [role="tab"]')
        : null

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        if (interactiveTarget && !interactiveTarget.closest('.game-menu')) return

        event.preventDefault()
        const direction = event.key === 'ArrowDown' ? 1 : -1
        setSelectedIndex((currentIndex) => normalizeIndex(currentIndex + direction))
        return
      }

      if (event.key === 'Enter') {
        if (interactiveTarget && !interactiveTarget.closest('.game-menu')) return

        event.preventDefault()
        activateSection(items[selectedIndex].id)
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        activateSection('home')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activateSection, items, normalizeIndex, selectedIndex])

  const activeItem = useMemo(
    () => items.find((item) => item.id === visibleId) ?? items[0],
    [items, visibleId],
  )

  const requestedItem = useMemo(
    () => items.find((item) => item.id === requestedId) ?? activeItem,
    [activeItem, items, requestedId],
  )

  return {
    activeId: visibleId,
    activeItem,
    activateSection,
    focusRequest,
    handleCovered,
    handleRevealed,
    isTransitioning,
    phase,
    reducedMotion,
    requestedItem,
    selectedIndex,
    selectItem,
  }
}
