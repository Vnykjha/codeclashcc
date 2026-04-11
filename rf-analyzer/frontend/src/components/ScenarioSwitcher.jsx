import { useEffect, useState } from 'react'

const SCENARIOS = [
  { key: 'peacekeeping',    label: 'Peacekeeping'    },
  { key: 'border_patrol',   label: 'Border Patrol'   },
  { key: 'active_conflict', label: 'Active Conflict' },
]

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

export default function ScenarioSwitcher() {
  const [active,  setActive]  = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch current scenario from backend on mount
  useEffect(() => {
    fetch('/api/scenario')
      .then(r => r.json())
      .then(d => setActive(d.scenario))
      .catch(() => setActive('active_conflict'))
  }, [])

  async function handleClick(key) {
    if (key === active || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/scenario', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: key }),
      })
      if (res.ok) setActive(key)
      else console.warn('[RF] Scenario switch rejected:', res.status)
    } catch (err) {
      console.warn('[RF] Failed to switch scenario:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {SCENARIOS.map(({ key, label }) => {
        const isActive   = key === active
        const isSpinning = isActive && loading

        return (
          <button
            key={key}
            onClick={() => handleClick(key)}
            disabled={loading}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border',
              'transition-colors duration-150 disabled:cursor-not-allowed',
              isActive
                ? 'bg-white text-gray-900 border-white'
                : 'bg-transparent text-white border-white/40 hover:border-white/80 hover:text-white',
            ].join(' ')}
          >
            {isSpinning && <Spinner />}
            {label}
          </button>
        )
      })}
    </div>
  )
}
