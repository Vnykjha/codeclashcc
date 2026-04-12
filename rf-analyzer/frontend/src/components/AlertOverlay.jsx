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

  return (
    <div
      onClick={clearAlert}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        background: 'linear-gradient(90deg, #7f0000, #cc0000, #7f0000)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Glitch title */}
        <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
          <span style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            letterSpacing: '0.12em',
          }}>
            !! THREAT DETECTED !!
          </span>
          <span style={{
            position: 'absolute',
            top: 0,
            left: 0,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
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
            fontSize: '1.1rem',
            letterSpacing: '0.12em',
            animation: 'glitch-2 0.7s steps(2) infinite 0.12s',
          }}>
            !! THREAT DETECTED !!
          </span>
        </div>

        {/* Signal details */}
        <span style={{
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          color: 'rgba(255,255,255,0.88)',
          letterSpacing: '0.04em',
        }}>
          [{s.id}] FREQ {s.frequency_mhz.toFixed(2)}MHz · {s.modulation} · SCORE {s.threat_score}/100 · CONF {Math.round(s.confidence * 100)}%
        </span>
      </div>

      {/* Countdown */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: '1.75rem',
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.9)',
        marginLeft: '24px',
        flexShrink: 0,
        minWidth: '2.5ch',
        textAlign: 'right',
      }}>
        {countdown}s
      </div>
    </div>
  )
}
