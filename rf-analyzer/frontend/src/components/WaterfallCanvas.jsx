import { useEffect, useRef } from 'react'

export default function WaterfallCanvas({ signals }) {
  const canvasRef = useRef(null)
  const lastSignalId = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Initialize with dark blue
    ctx.fillStyle = '#020617'
    ctx.fillRect(0, 0, width, height)

    const interval = setInterval(() => {
      // 1. Shift everything down
      const imageData = ctx.getImageData(0, 0, width, height - 1)
      ctx.putImageData(imageData, 0, 1)

      // 2. Draw new noise top row
      for (let x = 0; x < width; x++) {
        const noise = Math.random() * 20
        ctx.fillStyle = `rgb(2, 6, ${23 + noise})`
        ctx.fillRect(x, 0, 1, 1)
      }

      // 3. Draw signal if one exists and hasn't been drawn yet
      const latest = signals[0]
      if (latest && latest.id !== lastSignalId.current) {
        lastSignalId.current = latest.id
        
        // Map frequency to X (Our signals range widely, so let's use a modulus mapping for visual variety)
        const xPos = Math.floor(((latest.frequency_mhz * 2) % width))
        const bandWidth = Math.max(4, latest.bandwidth_khz / 20)
        
        const gradient = ctx.createLinearGradient(xPos - bandWidth, 0, xPos + bandWidth, 0)
        if (latest.label === 'hostile') {
          gradient.addColorStop(0, 'transparent')
          gradient.addColorStop(0.5, '#ef4444')
          gradient.addColorStop(1, 'transparent')
        } else if (latest.label === 'friendly') {
          gradient.addColorStop(0, 'transparent')
          gradient.addColorStop(0.5, '#22d3ee')
          gradient.addColorStop(1, 'transparent')
        } else {
          gradient.addColorStop(0, 'transparent')
          gradient.addColorStop(0.5, '#fbbf24')
          gradient.addColorStop(1, 'transparent')
        }
        
        ctx.fillStyle = gradient
        ctx.fillRect(xPos - bandWidth, 0, bandWidth * 2, 1)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [signals])

  return (
    <div className="glass rounded-lg overflow-hidden flex flex-col h-40">
      <div className="px-3 py-1.5 border-b border-white/5 flex justify-between items-center shrink-0">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Spectral Waterfall</h2>
        <span className="text-[8px] font-mono text-cyan-400">2.4GHz - 5.8GHz</span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={160} 
        className="w-full h-full object-cover opacity-80"
      />
    </div>
  )
}
