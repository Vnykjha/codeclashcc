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
          className="rounded-none border-0 h-auto min-h-14 flex flex-col sm:flex-row items-start sm:items-center px-4 sm:px-6 py-2 sm:py-0 gap-2 sm:gap-0 relative"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(5, 15, 30, 0.85)',
            borderBottom: '1px solid rgba(0,255,65,0.15)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          {/* TOP ROW on mobile: title + live indicator */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            {/* LEFT: title + subtitle */}
            <div className="shrink-0">
              <h1
                className="text-lg sm:text-xl font-bold tracking-tight glow-green"
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                RF Signal Analyzer
              </h1>
              <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Synthetic Signal Intelligence Dashboard</p>
            </div>

            {/* RIGHT (mobile): live indicator */}
            <div className="flex sm:hidden items-center gap-2 shrink-0">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${connected ? 'bg-green-400' : 'bg-red-500'}`}
                style={connected ? { animation: 'dot-ring 1.4s ease-out infinite' } : {}}
                title={connected ? 'Connected' : 'Disconnected'}
              />
              <span className={`text-xs font-mono ${connected ? 'text-green-400' : 'text-red-400'}`}>
                {connected ? 'LIVE' : 'DISCONNECTED'}
              </span>
            </div>
          </div>

          {/* CENTER: scenario switcher — absolutely centered on desktop, below title on mobile */}
          <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            <ScenarioSwitcher />
          </div>

          {/* RIGHT (desktop): sig/s + separator + live indicator */}
          <div className="hidden sm:flex ml-auto items-center gap-3 shrink-0">
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

          {/* Row 1: Metric bar — grid on mobile, single strip on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Card className="h-auto sm:h-14 flex items-center border-border/40 bg-card/60 backdrop-blur-sm">
              <CardContent className="flex items-center justify-between w-full h-full p-0 px-4 py-2 sm:py-0">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Total Signals
                </p>
                <CardTitle className="text-base font-mono font-bold leading-none text-foreground">
                  {animatedTotal.toLocaleString()}
                </CardTitle>
              </CardContent>
            </Card>

            <Card className="h-auto sm:h-14 flex items-center border-border/40 bg-card/60 backdrop-blur-sm">
              <CardContent className="flex items-center justify-between w-full h-full p-0 px-4 py-2 sm:py-0">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Threat Score
                </p>
                <CardTitle className={`text-base font-mono font-bold leading-none ${isHighThreat ? 'text-destructive' : 'text-foreground'}`}>
                  {animatedThreat}
                </CardTitle>
              </CardContent>
            </Card>

            <Card className="h-auto sm:h-14 flex items-center border-border/40 bg-card/60 backdrop-blur-sm">
              <CardContent className="flex items-center justify-between w-full h-full p-0 px-4 py-2 sm:py-0">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Avg Confidence
                </p>
                <CardTitle className="text-base font-mono font-bold leading-none text-foreground">
                  {avgConfDisplay}
                </CardTitle>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Spectrum waterfall — full width */}
          <SpectrogramCanvas signals={signals} />

          {/* Row 3: FeedTable + ThreatChart + RadarWidget — stacked on mobile, side-by-side on desktop */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            {/* Mobile order 1, Desktop order 1 */}
            <div className="w-full lg:flex-1 min-w-0 h-[200px] lg:h-[360px]">
              <ThreatChart signals={signals} />
            </div>
            {/* Mobile order 2, Desktop order 0 (move to left) */}
            <div className="w-full lg:flex-1 lg:order-first min-w-0 h-[300px] lg:h-[360px]">
              <FeedTable signals={signals} />
            </div>
            {/* Mobile order 3, Desktop order 2 */}
            <div className="w-full max-w-[300px] mx-auto lg:mx-0 lg:flex-shrink-0 h-[300px] lg:h-[360px]">
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
