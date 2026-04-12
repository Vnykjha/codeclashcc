import { createContext, useContext, useState, useRef, useCallback } from 'react'

const ThreatModeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [alertActive, setAlertActive] = useState(false)
  const [alertSignal, setAlertSignal] = useState(null)
  const timerRef = useRef(null)

  const triggerAlert = useCallback((signal) => {
    setAlertActive(true)
    setAlertSignal(signal)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setAlertActive(false)
      setAlertSignal(null)
    }, 6000)
  }, [])

  const clearAlert = useCallback(() => {
    clearTimeout(timerRef.current)
    setAlertActive(false)
    setAlertSignal(null)
  }, [])

  return (
    <ThreatModeContext.Provider value={{ alertActive, alertSignal, triggerAlert, clearAlert }}>
      {children}
    </ThreatModeContext.Provider>
  )
}

export function useThreatMode() {
  const ctx = useContext(ThreatModeContext)
  if (!ctx) throw new Error('useThreatMode must be used inside ThemeProvider')
  return ctx
}
