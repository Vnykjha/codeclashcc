import { useState, useEffect, useRef } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────

const CANVAS_H  = 180
const LABEL_H   = 14      // reserved strip at the bottom for freq labels
const SCROLL_PX = 2       // pixels to scroll per tick
const INTERVAL  = 500     // ms — matches WebSocket cadence
const FREQ_MIN  = 100     // MHz (left edge)
const FREQ_MAX  = 4200    // MHz (right edge)

// ── Pure canvas helpers (defined outside component — no stale closure risk) ──

function freqToX(freq, width) {
  return (freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN) * width
}

/**
 * Fill a 2px-tall strip at y=0 with dark-blue noise via ImageData.
 * Using ImageData avoids thousands of fillStyle round-trips per frame.
 */
function drawNoiseFloor(ctx, width) {
  const imgData = ctx.createImageData(width, SCROLL_PX)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    d[i]     = 4  + (Math.random() * 6  | 0)   // R: 4–9
    d[i + 1] = 13 + (Math.random() * 8  | 0)   // G: 13–20
    d[i + 2] = 36 + (Math.random() * 20 | 0)   // B: 36–55
    d[i + 3] = 255
  }
  ctx.putImageData(imgData, 0, 0)
}

/**
 * Draw a Gaussian-shaped signal blob on the 2px strip at y=0.
 * globalAlpha is scoped with save/restore so it doesn't bleed.
 */
function drawSignalBlob(ctx, sig, width) {
  const cx = freqToX(sig.frequency_mhz, width)
  let spread, peakColor

  if (sig.label === 'friendly') {
    spread = 8;  peakColor = '#00ffcc'
  } else if (sig.label === 'unknown') {
    spread = 12; peakColor = '#fbbf24'
  } else {
    spread = 20; peakColor = '#ff2020'
  }

  const sigma = spread / 3   // ~1% intensity at the edges

  ctx.save()
  ctx.fillStyle = peakColor
  for (let dx = -spread; dx <= spread; dx++) {
    const x = Math.round(cx + dx)
    if (x < 0 || x >= width) continue
    const intensity = Math.exp(-(dx * dx) / (2 * sigma * sigma))
    ctx.globalAlpha = intensity
    ctx.fillRect(x, 0, 1, SCROLL_PX)
  }

  // Hostile: add a saturated white center spike for emphasis
  if (sig.label === 'hostile') {
    ctx.globalAlpha = 1.0
    ctx.fillStyle   = '#ffffff'
    ctx.fillRect(Math.round(cx), 0, 2, SCROLL_PX)
  }

  ctx.restore()
}

/**
 * Draw frequency axis labels as a permanent overlay at the bottom.
 * Called every tick AFTER clearing the bottom strip so scrolled ghosts
 * are never visible.
 */
function drawAxisLabels(ctx, width) {
  const top = CANVAS_H - LABEL_H

  // Opaque backdrop so scrolled waterfall content can't bleed through
  ctx.fillStyle = 'rgba(0,0,0,0.85)'
  ctx.fillRect(0, top, width, LABEL_H)

  ctx.font         = '10px monospace'
  ctx.textBaseline = 'bottom'

  for (let freq = 500; freq <= 4000; freq += 500) {
    const x = Math.floor(freqToX(freq, width))

    // Tick line
    ctx.fillStyle = 'rgba(0,255,65,0.25)'
    ctx.fillRect(x, top, 1, LABEL_H)

    // Label — 8-digit hex color is supported in all modern browsers
    ctx.fillStyle = '#00ff4188'
    ctx.fillText(String(freq), x + 2, CANVAS_H - 2)
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SpectrogramCanvas({ signals = [] }) {
  const containerRef = useRef(null)
  const canvasRef    = useRef(null)
  const offscreenRef = useRef(null)
  // Keep a ref to the latest signals so the draw interval closure is never stale
  const signalsRef   = useRef(signals)

  const [canvasWidth, setCanvasWidth] = useState(800)

  // Sync latest signals into ref every render
  useEffect(() => {
    signalsRef.current = signals
  }, [signals])

  // Track container width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver(entries => {
      const w = Math.floor(entries[0].contentRect.width)
      if (w > 0) setCanvasWidth(w)
    })
    ro.observe(el)

    // Seed the initial width synchronously so the first draw is correct
    const initial = Math.floor(el.getBoundingClientRect().width)
    if (initial > 0) setCanvasWidth(initial)

    return () => ro.disconnect()
  }, [])

  // Main waterfall loop — rebuilt whenever canvas width changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasWidth === 0) return

    // Resize (or create) the offscreen scroll buffer
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas')
    }
    offscreenRef.current.width  = canvasWidth
    offscreenRef.current.height = CANVAS_H

    const ctx = canvas.getContext('2d')

    // Initial fill after React resets the canvas on width-attribute change
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvasWidth, CANVAS_H)
    drawAxisLabels(ctx, canvasWidth)

    // ── Waterfall tick ────────────────────────────────────────────────────────
    const tick = () => {
      const offscreen = offscreenRef.current
      const offCtx    = offscreen.getContext('2d')

      // 1. Snapshot the current canvas into the offscreen buffer
      offCtx.clearRect(0, 0, canvasWidth, CANVAS_H)
      offCtx.drawImage(canvas, 0, 0)

      // 2. Wipe the main canvas
      ctx.clearRect(0, 0, canvasWidth, CANVAS_H)

      // 3. Redraw the snapshot shifted down by SCROLL_PX — waterfall scroll
      ctx.drawImage(offscreen, 0, SCROLL_PX)

      // 4. Paint new 2px noise strip at the very top
      drawNoiseFloor(ctx, canvasWidth)

      // 5. Signal blobs for signals received in the last 2 seconds
      const now = Date.now()
      for (const sig of signalsRef.current) {
        if (now - new Date(sig.timestamp).getTime() < 2000) {
          drawSignalBlob(ctx, sig, canvasWidth)
        }
      }

      // 6. Clear the bottom strip and redraw clean axis labels (fixed overlay)
      ctx.clearRect(0, CANVAS_H - LABEL_H, canvasWidth, LABEL_H)
      drawAxisLabels(ctx, canvasWidth)
    }

    const intervalId = setInterval(tick, INTERVAL)
    return () => clearInterval(intervalId)
  }, [canvasWidth])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Panel title */}
      <p style={{
        fontFamily:    '"Courier New", Courier, monospace',
        fontSize:      '10px',
        color:         '#00ff41',
        letterSpacing: '0.1em',
        marginBottom:  '4px',
        textTransform: 'uppercase',
      }}>
        Spectrum Waterfall — 100–4200 MHz
      </p>

      {/* Canvas wrapper — measured by ResizeObserver */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width:    '100%',
          border:   '1px solid rgba(0,255,65,0.2)',
          background: '#000',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={CANVAS_H}
          style={{ display: 'block', width: '100%' }}
        />

        {/* Color legend — top-right HTML overlay */}
        <div style={{
          position:      'absolute',
          top:           5,
          right:         10,
          display:       'flex',
          gap:           '10px',
          fontSize:      '10px',
          fontFamily:    '"Courier New", Courier, monospace',
          color:         '#888888',
          pointerEvents: 'none',
          userSelect:    'none',
        }}>
          <span><span style={{ color: '#00ffcc' }}>■</span> Friendly</span>
          <span><span style={{ color: '#fbbf24' }}>■</span> Unknown</span>
          <span><span style={{ color: '#ff2020' }}>■</span> Hostile</span>
        </div>

        {/* Y-axis time label — left edge, vertical */}
        <div style={{
          position:      'absolute',
          left:          4,
          top:           6,
          color:         '#00ff41',
          opacity:       0.38,
          fontSize:      '9px',
          fontFamily:    '"Courier New", Courier, monospace',
          letterSpacing: '0.12em',
          pointerEvents: 'none',
          userSelect:    'none',
          writingMode:   'vertical-lr',
          transform:     'rotate(180deg)',
        }}>
          ▼ TIME
        </div>
      </div>
    </div>
  )
}
