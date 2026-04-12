import { useEffect, useState, useRef } from 'react'
import { useThreatMode } from '../context/ThemeContext'

export default function AlertOverlay() {
  const { alertActive, alertSignal, clearAlert } = useThreatMode()
  const [countdown, setCountdown] = useState(6)
  const intervalRef = useRef(null)

  // Reset and run countdown whenever a new alert fires (alertSignal identity changes)
  useEffect(() => {
    if (!alertActive || !alertSignal) {
      clearInterval(intervalRef.current)
      return
    }
    setCountdown(6)
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [alertSignal, alertActive])

  if (!alertActive || !alertSignal) return null

  const s = alertSignal
  const shortId = s.id.toString().slice(-4)

  return (
    <div
      onClick={clearAlert}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        background: 'linear-gradient(90deg, #7f0000, #cc0000, #7f0000)',
        padding: '10px 16px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div className="flex flex-col gap-1 sm:gap-2 flex-1">
        {/* Glitch title */}
        <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
          <span className="text-sm sm:text-lg font-bold tracking-wider" style={{ color: 'white' }}>
            !! THREAT DETECTED !!
          </span>
          <span style={{
            position: 'absolute',
            top: 0,
            left: 0,
            color: 'white',
            fontWeight: 'bold',
            fontSize: 'inherit',
            letterSpacing: '0.12em',
            animation: 'glitch-1 0.9s steps(2) infinite',
          }}>
            !! THREAT DETECTED !!
          </span>
          <span style={{
            position: 'absolute',
            top: 0,
            left: 0,
            color: 'white',
            fontWeight: 'bold',
            fontSize: 'inherit',
            letterSpacing: '0.12em',
            animation: 'glitch-2 0.7s steps(2) infinite 0.12s',
          }}>
            !! THREAT DETECTED !!
          </span>
        </div>

        {/* Signal details */}
        <span className="font-mono text-[11px] sm:text-xs text-white/90 tracking-wide">
          <span className="hidden sm:inline">[{s.id}]</span>
          <span className="inline sm:hidden">#{shortId}</span>
          {' · '}FREQ {s.frequency_mhz.toFixed(0)}<span className="hidden sm:inline">.{(s.frequency_mhz % 1).toFixed(2).slice(2)}</span>MHz
          {' · '}{s.modulation}
          {' · '}SCORE {s.threat_score}
          {' · '}{Math.round(s.confidence * 100)}%
        </span>

        {/* Mobile tap hint */}
        <span className="sm:hidden text-[9px] text-white/60 italic">tap to dismiss</span>
      </div>

      {/* Countdown */}
      <div className="font-mono text-2xl sm:text-3xl font-bold text-white/90 ml-auto sm:ml-6 shrink-0 min-w-[2.5ch] text-right">
        {countdown}s
      </div>
    </div>
  )
}
