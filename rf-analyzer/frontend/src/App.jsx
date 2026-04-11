import { useMemo } from 'react'
import useSignalFeed from './hooks/useSignalFeed'
import FeedTable from './components/FeedTable'
import ThreatChart from './components/ThreatChart'
import AlertBanner from './components/AlertBanner'
import ScenarioSwitcher from './components/ScenarioSwitcher'

function MetricCard({ label, value, highlight, pulse }) {
  return (
    <div className={`bg-gray-900 rounded-lg px-5 py-4 ${pulse ? 'animate-pulse' : ''}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${highlight ? 'text-red-400' : 'text-gray-100'}`}>
        {value}
      </p>
    </div>
  )
}

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

  const avgConfidence = useMemo(() => {
    if (signals.length === 0) return '—'
    const avg = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
    return (avg * 100).toFixed(1) + '%'
  }, [signals])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <AlertBanner signals={signals} />

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-green-400">RF Signal Analyzer</h1>
          <p className="text-xs text-gray-500 mt-0.5">Synthetic Signal Intelligence Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          {/* signals/sec counter */}
          <span className="text-xs font-mono text-gray-500 tabular-nums">
            {signalsPerSec} sig/s
          </span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}
            title={connected ? 'Connected' : 'Disconnected'}
          />
          <span className="text-xs text-gray-400">{connected ? 'Live' : 'Disconnected'}</span>
          <ScenarioSwitcher />
        </div>
      </header>

      {/* Main content — relative so the overlay can cover it */}
      <div className="flex-1 relative">
        {!connected && <NoConnectionOverlay />}

        <main className="p-6 space-y-5">
          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="Total Signals" value={totalSeen.toLocaleString()} />
            <MetricCard
              label="Current Threat Score"
              value={threatScore}
              highlight={threatScore > 70}
              pulse={threatScore > 70}
            />
            <MetricCard label="Avg Confidence" value={avgConfidence} />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <FeedTable signals={signals} />
            </div>
            <div>
              <ThreatChart signals={signals} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
