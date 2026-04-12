// Neon badge: glow-* classes supply their own `color`, so we only need bg + border
const BADGE = {
  friendly: 'bg-cyan-950/60  border border-cyan-500/30  glow-cyan',
  unknown:  'bg-amber-950/60 border border-amber-500/30 glow-amber',
  hostile:  'bg-red-950/60   border border-red-500/30   glow-red',
}

// Subtle tinted row backgrounds that work behind the glass table
const ROW_BG = {
  friendly: 'bg-cyan-950/20',
  unknown:  'bg-amber-950/20',
  hostile:  'bg-red-950/20',
}

function ThreatBar({ score }) {
  const color =
    score >= 70 ? 'bg-red-500' :
    score >= 40 ? 'bg-amber-400' :
                  'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 text-right tabular-nums text-gray-300">{score}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-700/60 min-w-[48px]">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

const SKELETON_COLS = 8
function SkeletonRow() {
  return (
    <tr className="border-t border-green-500/5">
      {Array.from({ length: SKELETON_COLS }).map((_, i) => (
        <td key={i} className="px-3 py-2">
          <div className="h-3 rounded bg-gray-800/60 animate-pulse" style={{ width: `${50 + (i * 17) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function FeedTable({ signals }) {
  const rows    = signals.slice(0, 15)
  const loading = rows.length === 0

  return (
    <div className="glass-panel rounded-lg overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-green-500/10 shrink-0">
        <h2 className="text-sm font-semibold text-gray-200 tracking-wide">Signal Feed</h2>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 text-gray-400" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <tr>
              <th className="px-3 py-2 text-left  whitespace-nowrap">Time</th>
              <th className="px-3 py-2 text-left  whitespace-nowrap font-mono">ID</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">Freq (MHz)</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">Power (dBm)</th>
              <th className="px-3 py-2 text-center">Mod</th>
              <th className="px-3 py-2 text-center">Label</th>
              <th className="px-3 py-2 text-right">Conf</th>
              <th className="px-3 py-2 text-left min-w-[120px]">Threat</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : rows.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={[
                      'feed-row',
                      `feed-row-${s.label}`,
                      'border-t border-green-500/5',
                      ROW_BG[s.label] ?? '',
                      idx === 0 ? 'animate-[fadeIn_0.25s_ease-in]' : '',
                    ].join(' ')}
                  >
                    <td className="px-3 py-1.5 text-gray-400 font-mono whitespace-nowrap">
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-1.5 text-gray-500 font-mono">{s.id}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-gray-200">
                      {s.frequency_mhz.toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-gray-200">
                      {s.power_dbm.toFixed(1)}
                    </td>
                    <td className="px-3 py-1.5 text-center font-mono text-gray-300">
                      {s.modulation}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${BADGE[s.label]}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-gray-300">
                      {(s.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-1.5">
                      <ThreatBar score={s.threat_score} />
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
