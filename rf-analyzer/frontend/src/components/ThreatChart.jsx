import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'

const GRID  = { strokeDasharray: '3 3', stroke: '#374151' }
const TICK  = { fill: '#6b7280', fontSize: 11 }
const TIP   = { background: '#111827', border: '1px solid #374151', color: '#f9fafb', fontSize: 12 }

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={TIP} className="rounded px-3 py-2 shadow-lg">
      <p className="text-gray-400 text-[11px] mb-1">{d.time}</p>
      <p className="font-mono font-bold text-red-400">Score: {d.score}</p>
      <p className={`text-[11px] capitalize ${
        d.label === 'hostile' ? 'text-red-400' :
        d.label === 'unknown' ? 'text-amber-400' : 'text-green-400'
      }`}>{d.label}</p>
    </div>
  )
}

export default function ThreatChart({ signals }) {
  const data = useMemo(() =>
    signals
      .slice(0, 30)       // newest-first from hook
      .reverse()          // oldest-first for left→right time flow
      .map(s => ({
        time:  new Date(s.timestamp).toLocaleTimeString(),
        score: s.threat_score,
        label: s.label,
      }))
  , [signals])

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-4">
        Threat score — live
      </h2>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="threatFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
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
            stroke="#ef4444"
            strokeDasharray="5 3"
            strokeOpacity={0.7}
            label={{
              value: 'Alert threshold',
              fill: '#ef4444',
              fontSize: 10,
              position: 'insideTopRight',
            }}
          />

          <Area
            type="monotone"
            dataKey="score"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#threatFill)"
            dot={false}
            activeDot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
