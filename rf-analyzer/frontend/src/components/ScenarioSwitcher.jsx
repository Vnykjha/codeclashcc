import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const SCENARIOS = [
  { value: 'peacekeeping',    label: 'PEACEKEEPING',    shortLabel: 'PEACE'    },
  { value: 'border_patrol',   label: 'BORDER PATROL',   shortLabel: 'BORDER'   },
  { value: 'active_conflict', label: 'ACTIVE CONFLICT', shortLabel: 'CONFLICT' },
]

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ScenarioSwitcher() {
  const [active,    setActive]    = useState(null)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    const path = API_BASE ? '/scenario' : '/api/scenario';
    fetch(`${API_BASE}${path}`)
      .then(r => r.json())
      .then(d => setActive(d.scenario))
      .catch(() => setActive('active_conflict'))
  }, [])

  async function handleSwitch(value) {
    if (value === active || switching) return
    setSwitching(true)
    try {
      const path = API_BASE ? '/scenario' : '/api/scenario';
      const res = await fetch(`${API_BASE}${path}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: value }),
      })
      if (res.ok) setActive(value)
      else console.warn('[RF] Scenario switch rejected:', res.status)
    } catch (err) {
      console.warn('[RF] Failed to switch scenario:', err)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border/40">
      {SCENARIOS.map(s => (
        <Button
          key={s.value}
          variant={active === s.value ? 'default' : 'ghost'}
          onClick={() => handleSwitch(s.value)}
          disabled={switching}
          className="rounded-none min-h-[44px] sm:min-h-[28px] h-auto sm:h-7 px-2 sm:px-3 font-mono text-[10px] tracking-widest border-0 border-r border-border/30 last:border-r-0 transition-colors"
        >
          {switching && active === s.value ? '···' : (
            <>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="inline sm:hidden">{s.shortLabel}</span>
            </>
          )}
        </Button>
      ))}
    </div>
  )
}
