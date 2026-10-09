import { useEffect, useState } from 'react'

const mediaQuery = '(prefers-reduced-motion: reduce)'

function getReducedMotionPreference() {
  if (typeof window === 'undefined') return false

  const queryOverride = new URLSearchParams(window.location.search).get('motion')
  return queryOverride === 'reduce' || window.matchMedia(mediaQuery).matches
}

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getReducedMotionPreference,
  )

  useEffect(() => {
    const motionQuery = window.matchMedia(mediaQuery)
    const handleChange = () => setPrefersReducedMotion(getReducedMotionPreference())

    handleChange()
    motionQuery.addEventListener('change', handleChange)

    return () => motionQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', prefersReducedMotion)

    return () => document.documentElement.classList.remove('reduce-motion')
  }, [prefersReducedMotion])

  return prefersReducedMotion
}
