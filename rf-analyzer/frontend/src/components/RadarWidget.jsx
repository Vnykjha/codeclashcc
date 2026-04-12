import { useState, useEffect, useRef } from 'react'

const CX = 150
const CY = 150
const OUTER_R = 130
const RINGS = [32, 64, 97, 130]
const KM_LABELS = ['10', '20', '30', '40']
const DOT_LIFETIME = 4000
const MIN_FREQ = 136
const MAX_FREQ = 4000
const MIN_R = 10
const MAX_R = 120

function freqToRadius(freq) {
  const clamped = Math.max(MIN_FREQ, Math.min(MAX_FREQ, freq))
  return MIN_R + ((clamped - MIN_FREQ) / (MAX_FREQ - MIN_FREQ)) * (MAX_R - MIN_R)
}

// Spread signals around the radar face using the numeric part of the ID
function hashId(id) {
  const num = parseInt(id.replace('sig_', ''), 10)
  return isNaN(num) ? 0 : (num * 137) % 360
}

// 60° pie-slice wedge: leading edge at 0° (3 o'clock), trailing at -60°
function buildSweepPath() {
  const trailRad = (-60 * Math.PI) / 180
  const x1 = CX + OUTER_R                          // leading: (280, 150)
  const y1 = CY
  const x2 = CX + OUTER_R * Math.cos(trailRad)     // trailing: (215, 37.42)
  const y2 = CY + OUTER_R * Math.sin(trailRad)
  // Arc from leading to trailing, counter-clockwise (sweep-flag=0), small arc (large-arc-flag=0)
  return `M ${CX},${CY} L ${x1},${y1} A ${OUTER_R},${OUTER_R} 0 0,0 ${x2.toFixed(2)},${y2.toFixed(2)} Z`
}

const SWEEP_PATH = buildSweepPath()

// Diagonal tick marks at 45° intervals on the outer ring
const TICK_DEGS = [45, 135, 225, 315]

// Corner bracket paths
const BRACKETS = [
  'M 10,30 L 10,10 L 30,10',
  'M 270,10 L 290,10 L 290,30',
  'M 10,270 L 10,290 L 30,290',
  'M 290,270 L 290,290 L 270,290',
]

export default function RadarWidget({ signals = [] }) {
  const [dots, setDots] = useState([])
  const [time, setTime] = useState(() => new Date().toLocaleTimeString())
  const seenRef = useRef(new Set())

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(id)
  }, [])

  // Convert incoming signals → radar dots (skip already-seen IDs)
  useEffect(() => {
    const newDots = []
    for (const sig of signals) {
      if (seenRef.current.has(sig.id)) continue
      seenRef.current.add(sig.id)
      const r = freqToRadius(sig.frequency_mhz)
      const angleRad = (hashId(sig.id) * Math.PI) / 180
      newDots.push({
        id: sig.id,
        x: CX + r * Math.cos(angleRad),
        y: CY + r * Math.sin(angleRad),
        type: sig.label,
        born: Date.now(),
      })
    }
    if (newDots.length > 0) {
      setDots(prev => [...prev, ...newDots])
    }
  }, [signals])

  // Expire dots older than DOT_LIFETIME
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      setDots(prev => {
        const next = prev.filter(d => now - d.born < DOT_LIFETIME)
        return next.length === prev.length ? prev : next
      })
    }, 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="glass-panel rounded-lg p-3">
      <p className="text-xs font-mono glow-green uppercase tracking-widest mb-2 px-1">
        SIGNALS / RADAR
      </p>

      <svg viewBox="0 0 300 300" width="300" height="300" style={{ display: 'block' }}>
        <defs>
          {/* Sweep gradient: transparent at center, semi-opaque green at leading edge */}
          <linearGradient id="sweepGrad" gradientUnits="userSpaceOnUse"
            x1="150" y1="150" x2="280" y2="150">
            <stop offset="0%"   stopColor="#00ff41" stopOpacity="0" />
            <stop offset="100%" stopColor="#00ff41" stopOpacity="0.35" />
          </linearGradient>

          {/* Clip beam + dots to the radar circle */}
          <clipPath id="radarClip">
            <circle cx={CX} cy={CY} r={OUTER_R} />
          </clipPath>

          {/* SVG glow filter for the SCANNING overlay text */}
          <filter id="scanGlow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Black background ── */}
        <circle cx={CX} cy={CY} r={OUTER_R} fill="black" />

        {/* ── Concentric range rings ── */}
        {RINGS.map(r => (
          <circle key={r} cx={CX} cy={CY} r={r}
            fill="none" stroke="#00ff41" strokeOpacity="0.15" strokeWidth="0.5" />
        ))}

        {/* ── Crosshair ── */}
        <line x1={CX - OUTER_R} y1={CY} x2={CX + OUTER_R} y2={CY}
          stroke="#00ff41" strokeOpacity="0.15" strokeWidth="0.5" />
        <line x1={CX} y1={CY - OUTER_R} x2={CX} y2={CY + OUTER_R}
          stroke="#00ff41" strokeOpacity="0.15" strokeWidth="0.5" />

        {/* ── Diagonal ticks at 45° intervals on outer ring ── */}
        {TICK_DEGS.map(deg => {
          const rad = (deg * Math.PI) / 180
          const inner = OUTER_R - 7
          return (
            <line key={deg}
              x1={CX + inner * Math.cos(rad)} y1={CY + inner * Math.sin(rad)}
              x2={CX + OUTER_R * Math.cos(rad)} y2={CY + OUTER_R * Math.sin(rad)}
              stroke="#00ff41" strokeOpacity="0.45" strokeWidth="1" />
          )
        })}

        {/* ── Range ring km labels at 3 o'clock ── */}
        {RINGS.map((r, i) => (
          <text key={r}
            x={CX + r + 3} y={CY - 2}
            fill="#00ff41" fillOpacity="0.45"
            fontSize="6" fontFamily="monospace"
            dominantBaseline="auto">
            {KM_LABELS[i]}
          </text>
        ))}

        {/* ── Rotating sweep beam ── */}
        <g className="sweep-arm" clipPath="url(#radarClip)">
          <path d={SWEEP_PATH} fill="url(#sweepGrad)" />
        </g>

        {/* ── Outer border ring (on top of beam) ── */}
        <circle cx={CX} cy={CY} r={OUTER_R}
          fill="none" stroke="#00ff41" strokeOpacity="0.5" strokeWidth="1" />

        {/* ── Corner bracket decorations ── */}
        {BRACKETS.map((d, i) => (
          <path key={i} d={d}
            fill="none" stroke="#00ff41" strokeOpacity="0.6" strokeWidth="1.5" />
        ))}

        {/* ── Signal dots ── */}
        <g clipPath="url(#radarClip)">
          {dots.map(dot => {
            if (dot.type === 'friendly') {
              return (
                <circle key={dot.id}
                  cx={dot.x} cy={dot.y} r="4"
                  fill="#00ff41"
                  style={{ animation: 'ping-fade 4s ease-out forwards' }} />
              )
            }

            if (dot.type === 'hostile') {
              return (
                <g key={dot.id}>
                  {/* Core dot */}
                  <circle
                    cx={dot.x} cy={dot.y} r="5"
                    fill="#ff2020"
                    style={{ animation: 'hostile-pulse 0.5s ease-in-out infinite' }} />
                  {/* Targeting reticle — snaps in once then holds */}
                  <g style={{
                    transformOrigin: `${dot.x}px ${dot.y}px`,
                    animation: 'reticle-snap 0.3s ease-out forwards',
                  }}>
                    <line x1={dot.x}      y1={dot.y - 10} x2={dot.x}      y2={dot.y - 5}
                      stroke="#ff2020" strokeWidth="1.2" />
                    <line x1={dot.x}      y1={dot.y + 5}  x2={dot.x}      y2={dot.y + 10}
                      stroke="#ff2020" strokeWidth="1.2" />
                    <line x1={dot.x - 10} y1={dot.y}      x2={dot.x - 5}  y2={dot.y}
                      stroke="#ff2020" strokeWidth="1.2" />
                    <line x1={dot.x + 5}  y1={dot.y}      x2={dot.x + 10} y2={dot.y}
                      stroke="#ff2020" strokeWidth="1.2" />
                  </g>
                </g>
              )
            }

            // unknown
            return (
              <circle key={dot.id}
                cx={dot.x} cy={dot.y} r="3.5"
                fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.8" />
            )
          })}
        </g>

        {/* ── Overlay text (top-left) ── */}
        <text x="14" y="22"
          fill="#00ff41" fontSize="10" fontFamily="monospace"
          letterSpacing="0.05em" filter="url(#scanGlow)">
          SCANNING
        </text>
        <text x="14" y="34"
          fill="#00ff41" fillOpacity="0.6" fontSize="8" fontFamily="monospace">
          {time}
        </text>
      </svg>
    </div>
  )
}
