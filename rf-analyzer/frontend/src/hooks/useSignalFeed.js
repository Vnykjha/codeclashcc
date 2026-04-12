import { useState, useEffect, useRef, useCallback } from 'react'

const MAX_SIGNALS = 50

// Backend URL configuration
const API_URL = import.meta.env.VITE_API_URL || '';

function getWsUrl() {
  // If we have a specific VITE_API_URL, use it to construct the WebSocket URL
  if (API_URL) {
    const url = new URL(API_URL);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${url.host}/ws/signals`;
  }
  
  // Default to window.location (local dev/Docker proxying)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/signals`;
}

const WS_URL = getWsUrl();


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
