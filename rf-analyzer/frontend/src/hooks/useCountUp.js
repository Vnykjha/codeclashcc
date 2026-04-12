import { useState, useEffect, useRef } from 'react'

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4)
}

/**
 * Animates from the previous value to `targetValue` over `duration` ms
 * using easeOutQuart and requestAnimationFrame.
 * Returns the current display value as an integer.
 */
export default function useCountUp(targetValue, duration = 400) {
  const [display, setDisplay] = useState(targetValue)

  const prevTargetRef = useRef(targetValue)
  const startValRef   = useRef(targetValue)
  const rafRef        = useRef(null)
  const startTsRef    = useRef(null)

  useEffect(() => {
    // No change — skip
    if (targetValue === prevTargetRef.current) return

    const from = prevTargetRef.current
    prevTargetRef.current = targetValue
    startValRef.current   = from

    // Cancel any in-progress animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startTsRef.current = null

    function frame(ts) {
      if (!startTsRef.current) startTsRef.current = ts
      const elapsed  = ts - startTsRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased    = easeOutQuart(progress)
      const current  = Math.round(from + (targetValue - from) * eased)
      setDisplay(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame)
      }
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [targetValue, duration])

  return display
}
