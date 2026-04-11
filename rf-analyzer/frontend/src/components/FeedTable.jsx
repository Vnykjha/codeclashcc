const ROW_BG = {
  friendly: 'bg-green-950',
  unknown:  'bg-yellow-950',
  hostile:  'bg-red-950',
}

const BADGE = {
  friendly: 'bg-green-800 text-green-200',
  unknown:  'bg-amber-800  text-amber-200',
  hostile:  'bg-red-800   text-red-200',
}

function ThreatBar({ score }) {
  const color =
    score >= 70 ? 'bg-red-500' :
    score >= 40 ? 'bg-amber-400' :
                  'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 text-right tabular-nums">{score}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-700 min-w-[48px]">
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
    <tr className="border-t border-gray-800/60">
      {Array.from({ length: SKELETON_COLS }).map((_, i) => (
        <td key={i} className="px-3 py-2">
          <div className="h-3 rounded bg-gray-800 animate-pulse" style={{ width: `${50 + (i * 17) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function FeedTable({ signals }) {
  const rows = signals.slice(0, 50)
  const loading = rows.length === 0

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-800 shrink-0">
        <h2 className="text-sm font-semibold text-gray-300">Signal Feed</h2>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-gray-800 text-gray-400">
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
                    className={`
                      border-t border-gray-800/60
                      ${ROW_BG[s.label] ?? 'bg-gray-900'}
                      transition-colors duration-200
                      ${idx === 0 ? 'animate-[fadeIn_0.25s_ease-in]' : ''}
                    `}
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
