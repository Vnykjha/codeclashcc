import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'

const NEON_RED = '#ff2020'

const GRID = { strokeDasharray: '3 3', stroke: 'rgba(0,255,65,0.08)' }
const TICK = { fill: '#6b7280', fontSize: 11 }
const TIP  = {
  background: 'rgba(5,15,30,0.95)',
  border: '1px solid rgba(0,255,65,0.2)',
  color: '#f9fafb',
  fontSize: 12,
  backdropFilter: 'blur(8px)',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={TIP} className="rounded px-3 py-2 shadow-lg">
      <p className="text-gray-400 text-[11px] mb-1">{d.time}</p>
      <p className="font-mono font-bold" style={{ color: NEON_RED }}>Score: {d.score}</p>
      <p className={`text-[11px] capitalize ${
        d.label === 'hostile' ? 'glow-red' :
        d.label === 'unknown' ? 'glow-amber' : 'glow-cyan'
      }`}>{d.label}</p>
    </div>
  )
}

export default function ThreatChart({ signals }) {
  const data = useMemo(() =>
    signals
      .slice(0, 30)
      .reverse()
      .map(s => ({
        time:  new Date(s.timestamp).toLocaleTimeString(),
        score: s.threat_score,
        label: s.label,
      }))
  , [signals])

  return (
    <div className="glass-panel rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-200 mb-4 tracking-wide">
        Threat score — live
      </h2>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="threatFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={NEON_RED} stopOpacity={0.2} />
              <stop offset="95%" stopColor={NEON_RED} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid {...GRID} />

          <XAxis
            dataKey="time"
            tick={TICK}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            domain={[0, 100]}
            tick={TICK}
            tickCount={6}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine
            y={70}
            stroke={NEON_RED}
            strokeDasharray="5 3"
            strokeOpacity={0.6}
            label={{
              value: 'Alert threshold',
              fill: NEON_RED,
              fontSize: 10,
              position: 'insideTopRight',
            }}
          />

          <Area
            type="monotone"
            dataKey="score"
            stroke={NEON_RED}
            strokeWidth={2}
            fill="url(#threatFill)"
            dot={false}
            activeDot={{ r: 4, fill: NEON_RED, strokeWidth: 0 }}
            isAnimationActive={false}
            style={{ filter: 'drop-shadow(0 0 4px rgba(255,32,32,0.7))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
