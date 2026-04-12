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
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center bg-red-600 text-white px-6 py-3 shadow-2xl animate-glitch-1 border-b-2 border-white/20">
      {/* Pulsing left-border accent */}
      <div className="w-1 self-stretch bg-white/80 rounded-full mr-4 shrink-0 animate-pulse" />

      <span className="text-sm font-bold tracking-widest min-w-0 flex gap-4 items-center">
        <span className="glitch-text text-lg italic" data-text="THREAT DETECTED">
          THREAT DETECTED
        </span>
        <div className="hidden md:flex gap-4 opacity-90 font-mono text-xs">
          <span>ID: {threat.id}</span>
          <span>{threat.frequency_mhz.toFixed(2)} MHz</span>
          <span>CONFIDENCE: {(threat.confidence * 100).toFixed(0)}%</span>
          <span className="bg-white text-red-600 px-2 rounded">SCORE: {threat.threat_score}</span>
        </div>
      </span>

      <button
        className="ml-auto pl-6 shrink-0 opacity-70 hover:opacity-100 text-2xl leading-none transition-opacity"
        onClick={() => { clearTimeout(timerRef.current); setThreat(null) }}
        aria-label="Dismiss alert"
      >
        ×
      </button>
    </div>
  )
}
