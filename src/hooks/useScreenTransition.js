import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useScreenTransition({ initialId, validIds, reducedMotion }) {
  const validIdSet = useMemo(() => new Set(validIds), [validIds])
  const [visibleId, setVisibleId] = useState(initialId)
  const [requestedId, setRequestedId] = useState(initialId)
  const [phase, setPhase] = useState('idle')
  const [focusRequest, setFocusRequest] = useState(0)

  const mountedRef = useRef(true)
  const phaseRef = useRef('idle')
  const visibleIdRef = useRef(initialId)
  const requestedIdRef = useRef(initialId)
  const queuedIdRef = useRef(null)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  const setTransitionPhase = useCallback((nextPhase) => {
    phaseRef.current = nextPhase
    if (mountedRef.current) setPhase(nextPhase)
  }, [])

  const commitImmediately = useCallback((id) => {
    visibleIdRef.current = id
    requestedIdRef.current = id
    queuedIdRef.current = null
    phaseRef.current = 'idle'

    if (!mountedRef.current) return
    setVisibleId(id)
    setRequestedId(id)
    setPhase('idle')
    setFocusRequest((request) => request + 1)
  }, [])

  const requestTransition = useCallback((id) => {
    if (!validIdSet.has(id)) return false

    if (reducedMotion) {
      if (id !== visibleIdRef.current) commitImmediately(id)
      return true
    }

    if (phaseRef.current === 'idle') {
      if (id === visibleIdRef.current) return false

      requestedIdRef.current = id
      setRequestedId(id)
      setTransitionPhase('covering')
      return true
    }

    if (phaseRef.current === 'covering') {
      requestedIdRef.current = id
      setRequestedId(id)
      return true
    }

    queuedIdRef.current = id
    return true
  }, [commitImmediately, reducedMotion, setTransitionPhase, validIdSet])

  const handleCovered = useCallback(() => {
    if (phaseRef.current !== 'covering' || !mountedRef.current) return

    const nextId = requestedIdRef.current
    visibleIdRef.current = nextId
    setVisibleId(nextId)
    setTransitionPhase('revealing')
  }, [setTransitionPhase])

  const handleRevealed = useCallback(() => {
    if (phaseRef.current !== 'revealing' || !mountedRef.current) return

    const queuedId = queuedIdRef.current
    queuedIdRef.current = null

    if (queuedId && queuedId !== visibleIdRef.current) {
      requestedIdRef.current = queuedId
      setRequestedId(queuedId)
      setTransitionPhase('covering')
      return
    }

    requestedIdRef.current = visibleIdRef.current
    setRequestedId(visibleIdRef.current)
    setTransitionPhase('idle')
    setFocusRequest((request) => request + 1)
  }, [setTransitionPhase])

  useEffect(() => {
    if (reducedMotion || phase === 'idle') return undefined

    // Animation events can be skipped when the page is backgrounded or the
    // browser changes rendering state mid-transition. Keep the interface from
    // remaining covered and unfocusable if that happens.
    const timeout = window.setTimeout(() => {
      if (phaseRef.current !== phase) return

      if (phase === 'covering') handleCovered()
      if (phase === 'revealing') handleRevealed()
    }, phase === 'covering' ? 700 : 800)

    return () => window.clearTimeout(timeout)
  }, [handleCovered, handleRevealed, phase, reducedMotion])

  useEffect(() => {
    if (!reducedMotion || phaseRef.current === 'idle') return

    const immediateDestination = queuedIdRef.current ?? requestedIdRef.current
    commitImmediately(immediateDestination)
  }, [commitImmediately, reducedMotion])

  return {
    focusRequest,
    handleCovered,
    handleRevealed,
    isTransitioning: phase !== 'idle',
    phase,
    requestTransition,
    requestedId,
    visibleId,
  }
}
