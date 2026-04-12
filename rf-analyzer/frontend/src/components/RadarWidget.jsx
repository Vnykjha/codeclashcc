import { useMemo } from 'react'

export default function RadarWidget({ signals }) {
  // Map frequency (2400-2500 for demo) to rotation angle
  // In our simulator, friendly is ~150MHz, unknown is ~400MHz, hostile is ~3000MHz
  // Let's normalize frequencies to a 0-360 deg circle for visualization
  const dots = useMemo(() => {
    return signals.slice(0, 15).map((s, i) => {
      const angle = (s.frequency_mhz * 0.1) % 360
      const radius = 30 + (s.power_dbm + 100) * 0.5 // Map power to distance from center
      const opacity = Math.max(0, 1 - i * 0.08)
      
      return {
        id: s.id,
        x: 50 + radius * Math.cos((angle * Math.PI) / 180),
        y: 50 + radius * Math.sin((angle * Math.PI) / 180),
        color: s.label === 'hostile' ? '#ef4444' : s.label === 'friendly' ? '#22d3ee' : '#fbbf24',
        opacity,
        isHostile: s.label === 'hostile'
      }
    })
  }, [signals])

  const latestHostile = dots.find(d => d.isHostile)

  return (
    <div className="glass rounded-lg p-4 flex flex-col items-center">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 w-full">Signal Radar</h2>
      
      <div className="relative w-48 h-48">
        {/* Radar Circles */}
        <div className="absolute inset-0 border border-green-500/20 rounded-full" />
        <div className="absolute inset-2 border border-green-500/20 rounded-full" />
        <div className="absolute inset-10 border border-green-500/20 rounded-full" />
        <div className="absolute inset-20 border border-green-500/20 rounded-full" />
        
        {/* Crosshairs */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-green-500/20" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-green-500/20" />
        
        {/* Sweeping Arm */}
        <div className="absolute inset-0 animate-radar-sweep origin-center">
          <div className="absolute top-0 left-1/2 w-1/2 h-1/2 bg-gradient-to-tr from-green-500/40 to-transparent rounded-tr-full" 
               style={{ transform: 'translateX(-100%)' }} />
        </div>

        {/* Signal Dots */}
        {dots.map(dot => (
          <div
            key={dot.id}
            className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              backgroundColor: dot.color,
              opacity: dot.opacity,
              boxShadow: `0 0 8px ${dot.color}`
            }}
          >
            {dot.isHostile && (
              <div className="absolute inset-0 rounded-full animate-ping-hostile" style={{ backgroundColor: dot.color }} />
            )}
          </div>
        ))}

        {/* Targeting Reticle */}
        {latestHostile && (
          <div 
            className="absolute w-6 h-6 border border-red-500/50 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300"
            style={{ left: `${latestHostile.x}%`, top: `${latestHostile.y}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-px h-2 bg-red-500" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-px h-2 bg-red-500" />
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-px bg-red-500" />
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-px bg-red-500" />
          </div>
        )}
      </div>
      
      <div className="mt-4 flex gap-4 text-[10px] font-mono">
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> FRIENDLY</div>
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> HOSTILE</div>
      </div>
    </div>
  )
}
