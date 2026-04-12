import { useMemo, useState, useEffect } from 'react'
import useSignalFeed from './hooks/useSignalFeed'
import FeedTable from './components/FeedTable'
import ThreatChart from './components/ThreatChart'
import AlertBanner from './components/AlertBanner'
import ScenarioSwitcher from './components/ScenarioSwitcher'
import TerminalLog from './components/TerminalLog'
import RadarWidget from './components/RadarWidget'
import WaterfallCanvas from './components/WaterfallCanvas'

// Custom hook for rolling number effect
function useCountUp(end, duration = 500) {
  const [count, setCount] = useState(end)
  useEffect(() => {
    let startTimestamp = null
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      setCount(Math.floor(progress * (end - count) + count))
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }, [end])
  return count
}

function MetricCard({ label, value, highlight, pulse, animate = false }) {
  const displayValue = animate && typeof value === 'number' ? useCountUp(value) : value
  return (
    <div className={`glass rounded-lg px-5 py-4 transition-all duration-300 ${pulse ? 'ring-2 ring-red-500 animate-pulse' : ''}`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-black font-mono tracking-tighter ${highlight ? 'text-red-500 glow-red' : 'text-cyan-400 glow-cyan'}`}>
        {displayValue}
      </p>
    </div>
  )
}

function NoConnectionOverlay() {
  return (
    <div className="absolute inset-0 z-40 bg-gray-950/80 backdrop-blur-xl flex items-center justify-center">
      <div className="text-center p-8 glass rounded-2xl">
        <div className="w-4 h-4 rounded-full bg-red-500 mx-auto mb-4 animate-ping" />
        <p className="text-gray-200 font-bold text-lg tracking-tighter uppercase">Signal Lost</p>
        <p className="text-gray-500 text-xs mt-2 font-mono">Re-establishing uplink...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { signals, threatScore, connected, totalSeen, signalsPerSec, logs, redAlert } = useSignalFeed()

  const avgConfidence = useMemo(() => {
    if (signals.length === 0) return 0
    const avg = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
    return Math.round(avg * 100)
  }, [signals])

  return (
    <div 
      className={`min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans overflow-hidden ${redAlert ? 'animate-shake' : ''}`}
      data-alert={redAlert}
    >
      <AlertBanner signals={signals} />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 glass border-b border-white/5 z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center font-black text-black">RF</div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">Command Center v0.1</h1>
            <p className="text-[9px] text-gray-500 font-bold tracking-[0.2em] uppercase mt-0.5">Signal Intelligence & Threat Detection</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Network Status</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-400 tabular-nums">DATA_RATE: {signalsPerSec} pps</span>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
            </div>
          </div>
          <ScenarioSwitcher />
        </div>
      </header>

      {/* Main Layout: 3 Columns */}
      <div className="flex-1 flex relative overflow-hidden">
        {!connected && <NoConnectionOverlay />}

        {/* Column 1: Terminal Log (Sidebar Left) */}
        <aside className="w-72 shrink-0 border-r border-white/5 hidden lg:block">
          <TerminalLog logs={logs} />
        </aside>

        {/* Column 2: Main Content (Center) */}
        <main className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="Total Packets" value={totalSeen} animate={true} />
            <MetricCard
              label="Threat Level"
              value={threatScore}
              highlight={threatScore > 70}
              pulse={threatScore > 70}
              animate={true}
            />
            <MetricCard label="Avg Confidence" value={avgConfidence + '%'} />
          </div>

          {/* Waterfall */}
          <WaterfallCanvas signals={signals} />

          {/* Signal Feed */}
          <div className="flex-1 min-h-0">
            <FeedTable signals={signals} />
          </div>
        </main>

        {/* Column 3: Stats & Radar (Sidebar Right) */}
        <aside className="w-80 shrink-0 p-6 space-y-6 border-l border-white/5 hidden xl:flex flex-col">
          <RadarWidget signals={signals} />
          <div className="flex-1">
            <ThreatChart signals={signals} />
          </div>
        </aside>
      </div>
      
      {/* Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50"></div>
    </div>
  )
}
