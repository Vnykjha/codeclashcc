import { useMemo, useEffect, useRef } from 'react'
import useSignalFeed from './hooks/useSignalFeed'
import useCountUp from './hooks/useCountUp'
import FeedTable from './components/FeedTable'
import ThreatChart from './components/ThreatChart'
import AlertOverlay from './components/AlertOverlay'
import ScenarioSwitcher from './components/ScenarioSwitcher'
import RadarWidget from './components/RadarWidget'
import TerminalLog from './components/TerminalLog'
import SpectrogramCanvas from './components/SpectrogramCanvas'
import { useThreatMode } from './context/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function NoConnectionOverlay() {
  return (
    <div className="absolute inset-0 z-40 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-3" />
        <p className="text-gray-200 font-semibold text-sm">No connection</p>
        <p className="text-gray-500 text-xs mt-1">Reconnecting to backend…</p>
      </div>
    </div>
  )
}

export default function App() {
  const { signals, threatScore, connected, totalSeen, signalsPerSec } = useSignalFeed()
  const { alertActive, triggerAlert } = useThreatMode()
  const lastSignalIdRef = useRef(null)

  // Watch for new high-threat signals and fire the alert
  useEffect(() => {
    const latest = signals[0]
    if (!latest) return
    if (latest.id === lastSignalIdRef.current) return
    lastSignalIdRef.current = latest.id
    if (latest.threat_score > 70 && !alertActive) {
      triggerAlert(latest)
    }
  }, [signals, triggerAlert, alertActive])

  // ── Animated metric values ──────────────────────────────────────────────────
  const animatedThreat = useCountUp(threatScore, 350)
  const animatedTotal  = useCountUp(totalSeen,  400)

  // Average confidence as integer 0–100 for animation, displayed as 0.XX
  const avgConfNum = useMemo(() => {
    if (signals.length === 0) return 0
    const avg = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
    return Math.round(avg * 100)
  }, [signals])
  const animatedConf   = useCountUp(avgConfNum, 400)
  const avgConfDisplay = signals.length === 0 ? '—' : (animatedConf / 100).toFixed(2)

  const isHighThreat = threatScore > 70

  return (
    <div className={`min-h-screen bg-[#030712] text-gray-100 flex flex-col${alertActive ? ' alert-mode' : ''}`}>
      <AlertOverlay />

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40">
        <Card
          className="rounded-none border-0 h-14 flex items-center px-6 relative"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(5, 15, 30, 0.85)',
            borderBottom: '1px solid rgba(0,255,65,0.15)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          {/* LEFT: title + subtitle */}
          <div className="shrink-0">
            <h1
              className="text-xl font-bold tracking-tight glow-green"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              RF Signal Analyzer
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Synthetic Signal Intelligence Dashboard</p>
          </div>

          {/* CENTER: scenario switcher — absolutely centered */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <ScenarioSwitcher />
          </div>

          {/* RIGHT: sig/s + separator + live indicator */}
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              {signalsPerSec} sig/s
            </span>

            <Separator orientation="vertical" className="h-4" />

            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${connected ? 'bg-green-400' : 'bg-red-500'}`}
              style={connected ? { animation: 'dot-ring 1.4s ease-out infinite' } : {}}
              title={connected ? 'Connected' : 'Disconnected'}
            />
            <span className={`text-xs font-mono ${connected ? 'text-green-400' : 'text-red-400'}`}>
              {connected ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </div>
        </Card>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 relative">
        {!connected && <NoConnectionOverlay />}

        <main className="p-6 flex flex-col gap-5">

          {/* Row 1: Metric bar — single 56px strip */}
          <Card className="h-14 flex items-center border-border/40 bg-card/60 backdrop-blur-sm">
            <CardContent className="flex items-center w-full h-full p-0 px-2">

              <CardHeader className="flex-row items-center gap-3 p-0 px-4 space-y-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Total Signals
                </p>
                <CardTitle className="text-base font-mono font-bold leading-none text-foreground">
                  {animatedTotal.toLocaleString()}
                </CardTitle>
              </CardHeader>

              <Separator orientation="vertical" className="h-6" />

              <CardHeader className="flex-row items-center gap-3 p-0 px-4 space-y-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Threat Score
                </p>
                <CardTitle className={`text-base font-mono font-bold leading-none ${isHighThreat ? 'text-destructive' : 'text-foreground'}`}>
                  {animatedThreat}
                </CardTitle>
              </CardHeader>

              <Separator orientation="vertical" className="h-6" />

              <CardHeader className="flex-row items-center gap-3 p-0 px-4 space-y-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Avg Confidence
                </p>
                <CardTitle className="text-base font-mono font-bold leading-none text-foreground">
                  {avgConfDisplay}
                </CardTitle>
              </CardHeader>

            </CardContent>
          </Card>

          {/* Row 2: Spectrum waterfall — full width */}
          <SpectrogramCanvas signals={signals} />

          {/* Row 3: FeedTable (flex-1) + ThreatChart (flex-1) + RadarWidget (300px) */}
          <div className="flex gap-4 items-stretch h-[360px]">
            <div className="flex-1 min-w-0">
              <FeedTable signals={signals} />
            </div>
            <div className="flex-1 min-w-0">
              <ThreatChart signals={signals} />
            </div>
            <div className="flex-shrink-0">
              <RadarWidget signals={signals} />
            </div>
          </div>

          {/* Row 4: Terminal log — full width */}
          <TerminalLog signals={signals} />
        </main>
      </div>
    </div>
  )
}
