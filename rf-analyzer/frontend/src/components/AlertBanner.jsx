import { useEffect, useRef, useState } from 'react'

export default function AlertBanner({ signals }) {
  const [threat, setThreat] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const latest = signals[0]
    if (!latest || latest.threat_score <= 70) return

    // New threat (or replacement) — update banner and reset the 5s timer
    setThreat(latest)

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setThreat(null), 5000)
  }, [signals])

  // Clean up timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), [])

  if (!threat) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center bg-red-600 text-white px-6 py-3 shadow-xl">
      {/* Pulsing left-border accent */}
      <div className="w-1 self-stretch bg-white/80 rounded-full mr-4 shrink-0 animate-pulse" />

      <span className="text-sm font-medium tracking-wide min-w-0">
        <span className="font-bold">THREAT DETECTED</span>
        {' — '}
        {threat.id}
        {' · '}
        {threat.frequency_mhz.toFixed(2)} MHz
        {' · '}
        {threat.modulation}
        {' · Confidence '}
        {(threat.confidence * 100).toFixed(0)}%
        {' · Score '}
        <span className="font-bold">{threat.threat_score}</span>
      </span>

      <button
        className="ml-auto pl-6 shrink-0 opacity-70 hover:opacity-100 text-xl leading-none transition-opacity"
        onClick={() => { clearTimeout(timerRef.current); setThreat(null) }}
        aria-label="Dismiss alert"
      >
        ×
      </button>
    </div>
  )
}
