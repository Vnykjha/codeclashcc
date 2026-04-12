import { useState, useEffect, useRef, useCallback } from 'react'

const MAX_SIGNALS = 50

// Works in all environments:
// - Local dev: proxied through Vite to localhost:8000
// - Docker local: proxied through Nginx to backend:8000
// - Railway prod: proxied through Nginx to backend Railway URL
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const WS_URL = `${protocol}//${window.location.host}/ws/signals`

function getWsUrl() {
  return WS_URL
}

export default function useSignalFeed() {
  const [signals,    setSignals]    = useState([])
  const [threatScore, setThreatScore] = useState(0)
  const [connected,  setConnected]  = useState(false)
  const [totalSeen,  setTotalSeen]  = useState(0)
  const [signalsPerSec, setSignalsPerSec] = useState(0)

  const wsRef        = useRef(null)
  const unmountedRef = useRef(false)
  // Ring buffer of timestamps for the 1-second window
  const tsWindowRef  = useRef([])

  // Tick the signals/sec counter every 500ms
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      tsWindowRef.current = tsWindowRef.current.filter(t => now - t < 1000)
      setSignalsPerSec(tsWindowRef.current.length)
    }, 500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    unmountedRef.current = false

    function connect() {
      if (unmountedRef.current) return

      const url = getWsUrl()
      const ws  = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[RF] WebSocket connected to', url)
        setConnected(true)
      }

      ws.onclose = () => {
        console.log('[RF] WebSocket disconnected — reconnecting in 2s...')
        setConnected(false)
        if (!unmountedRef.current) setTimeout(connect, 2000)
      }

      ws.onerror = (err) => {
        console.warn('[RF] WebSocket error', err)
        ws.close()
      }

      ws.onmessage = (e) => {
        const signal = JSON.parse(e.data)
        tsWindowRef.current.push(Date.now())
        setThreatScore(signal.threat_score)
        setTotalSeen(n => n + 1)
        setSignals(prev => [signal, ...prev.filter(s => s.id !== signal.id)].slice(0, MAX_SIGNALS))
      }
    }

    connect()

    return () => {
      unmountedRef.current = true
      wsRef.current?.close()
    }
  }, [])

  return { signals, threatScore, connected, totalSeen, signalsPerSec }
}
