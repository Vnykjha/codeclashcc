import { useState, useEffect, useRef } from 'react'

const MAX_LINES  = 200
const CHAR_MS    = 4    // perceived ms per character
const TICK_MS    = 16   // ~60fps update interval
const STAGGER    = 80   // ms between successive lines for one signal

// Terminal palette
const C_LINE1    = '#6b9e6b'   // scan header — gray-green
const C_LINE2    = '#3d6b3d'   // classifier  — dim green
const C_FRIENDLY = '#00ffcc'
const C_UNKNOWN  = '#fbbf24'
const C_HOSTILE  = '#ff0040'

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatTs(iso) {
  const d  = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

function buildLineSpecs(sig, now) {
  const ts  = formatTs(sig.timestamp)
  const pct = Math.round(sig.confidence * 100)

  const specs = [
    {
      id:       `${sig.id}-1`,
      fullText: `[${ts}] >> INTERCEPT #${sig.id} · FREQ ${sig.frequency_mhz.toFixed(2)}MHz · BW ${sig.bandwidth_khz.toFixed(1)}kHz`,
      color:    C_LINE1,
      italic:   false,
      startAt:  now,
    },
    {
      id:       `${sig.id}-2`,
      fullText: `[${ts}]    EXECUTING CLASSIFIER... mod=${sig.modulation} pwr=${sig.power_dbm.toFixed(1)}dBm`,
      color:    C_LINE2,
      italic:   true,
      startAt:  now + STAGGER,
    },
  ]

  if (sig.label === 'friendly') {
    specs.push({
      id:       `${sig.id}-3`,
      fullText: `[${ts}] >> RESULT: FRIENDLY  [CONF: ${pct}%]  [IFF: VERIFIED]  [SCORE: ${sig.threat_score}]`,
      color:    C_FRIENDLY,
      startAt:  now + STAGGER * 2,
    })
  } else if (sig.label === 'unknown') {
    specs.push({
      id:       `${sig.id}-3`,
      fullText: `[${ts}] >> RESULT: UNKNOWN   [CONF: ${pct}%]  [IFF: NONE]      [SCORE: ${sig.threat_score}]`,
      color:    C_UNKNOWN,
      startAt:  now + STAGGER * 2,
    })
  } else {
    // hostile — 4 lines
    specs.push(
      {
        id:       `${sig.id}-3`,
        fullText: `[${ts}] >> RESULT: !! HOSTILE !! [CONF: ${pct}%] [IFF: FAIL] [SCORE: ${sig.threat_score}] <<<`,
        color:    C_HOSTILE,
        startAt:  now + STAGGER * 2,
      },
      {
        id:       `${sig.id}-4`,
        fullText: `[${ts}]    *** THREAT THRESHOLD ${sig.threat_score > 70 ? 'EXCEEDED' : 'MONITORED'} · OPERATOR NOTIFIED ***`,
        color:    C_HOSTILE,
        startAt:  now + STAGGER * 3,
      }
    )
  }

  return specs
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TerminalLog({ signals = [] }) {
  const [lines,  setLines]  = useState([])
  const [uptime, setUptime] = useState('00:00:00')
  const [stats,  setStats]  = useState({ total: 0, hostile: 0 })

  const seenRef      = useRef(new Set())   // signal IDs already queued
  const pendingRef   = useRef([])          // specs waiting for their startAt
  const activeRef    = useRef([])          // specs currently being typed
  const containerRef = useRef(null)        // scrollable log body
  const startRef     = useRef(Date.now())  // component mount time

  // ── Auto-scroll to bottom on every lines change ──
  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  // ── Uptime counter (1s tick) ──
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000)
      const h = Math.floor(elapsed / 3600)
      const m = Math.floor((elapsed % 3600) / 60)
      const s = elapsed % 60
      setUptime(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      )
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Convert new signals → queued line specs ──
  useEffect(() => {
    const now = Date.now()
    for (const sig of signals) {
      if (seenRef.current.has(sig.id)) continue
      seenRef.current.add(sig.id)
      pendingRef.current.push(...buildLineSpecs(sig, now))
      setStats(s => ({
        total:   s.total + 1,
        hostile: s.hostile + (sig.label === 'hostile' ? 1 : 0),
      }))
    }
  }, [signals])

  // ── Master typing ticker (~60fps) ──
  // Each tick:
  //   1. Move pending specs whose startAt has passed into activeRef + state
  //   2. Advance character count for all active specs
  useEffect(() => {
    const tickId = setInterval(() => {
      const now = Date.now()

      // Activate lines whose delay has elapsed
      const newActivated = []
      const stillPending = []
      for (const p of pendingRef.current) {
        if (now >= p.startAt) newActivated.push(p)
        else stillPending.push(p)
      }
      pendingRef.current = stillPending

      if (newActivated.length > 0) {
        activeRef.current.push(...newActivated)
        setLines(prev =>
          [...prev, ...newActivated.map(p => ({
            id:            p.id,
            displayedText: '',
            fullText:      p.fullText,
            color:         p.color,
            italic:        p.italic || false,
            done:          false,
          }))].slice(-MAX_LINES)
        )
      }

      // Advance active typing lines
      if (activeRef.current.length === 0) return

      const updates    = new Map()
      const stillActive = []
      for (const t of activeRef.current) {
        const chars = Math.min(
          Math.floor((now - t.startAt) / CHAR_MS),
          t.fullText.length
        )
        updates.set(t.id, {
          text: t.fullText.slice(0, chars),
          done: chars >= t.fullText.length,
        })
        if (chars < t.fullText.length) stillActive.push(t)
      }
      activeRef.current = stillActive

      // React 18 batches both setLines calls in the same interval tick
      setLines(prev =>
        prev.map(l => {
          const u = updates.get(l.id)
          return u ? { ...l, displayedText: u.text, done: u.done } : l
        })
      )
    }, TICK_MS)

    return () => clearInterval(tickId)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  const elevated = stats.hostile > 10

  return (
    <div style={{
      background:    '#000000',
      border:        '1px solid rgba(0,255,65,0.3)',
      fontFamily:    '"Courier New", Courier, monospace',
      fontSize:      '12px',
      display:       'flex',
      flexDirection: 'column',
      height:        '220px',
    }}>

      {/* ── Title bar ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        borderBottom:   '1px solid rgba(0,255,65,0.3)',
        padding:        '5px 12px',
        position:       'relative',
        flexShrink:     0,
      }}>
        <span style={{ color: '#00ff41', letterSpacing: '0.1em', fontSize: '11px' }}>
          [ RAW SIGNAL INTERCEPT ]
        </span>
        <span className="cursor" style={{ color: '#00ff41', marginLeft: '3px' }}>▊</span>
        <span className="hidden sm:block" style={{
          position:      'absolute',
          right:         '12px',
          color:         '#00ff41',
          opacity:       0.55,
          fontSize:      '10px',
          letterSpacing: '0.04em',
        }}>
          UPTIME: {uptime}
        </span>
      </div>

      {/* ── Scrollable log body ── */}
      <div
        ref={containerRef}
        className="terminal-log-body"
        style={{ flex: 1, overflowY: 'auto', padding: '6px 12px' }}
      >
        {lines.map(line => (
          <div
            key={line.id}
            style={{
              color:      line.color,
              fontStyle:  line.italic ? 'italic' : 'normal',
              lineHeight: '1.65',
              whiteSpace: 'pre',
            }}
          >
            {line.displayedText}
            {!line.done && <span className="cursor">▊</span>}
          </div>
        ))}
      </div>

      {/* ── Status bar ── */}
      <div className="flex flex-wrap gap-x-2 gap-y-1" style={{
        borderTop:     '1px solid rgba(0,255,65,0.3)',
        padding:       '4px 12px',
        fontSize:      '10px',
        color:         elevated ? C_HOSTILE : '#00ff41',
        flexShrink:    0,
        letterSpacing: '0.06em',
      }}>
        <span>SIGNALS PROCESSED: {stats.total}</span>
        <span>·</span>
        <span>THREATS: {stats.hostile}</span>
        <span>·</span>
        <span>{elevated ? '!! ELEVATED !!' : 'NOMINAL'}</span>
      </div>
    </div>
  )
}
