import { useEffect, useRef } from 'react'

export default function TerminalLog({ logs }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0 // Newest on top if list is reversed, or bottom if normal
    }
  }, [logs])

  return (
    <div className="flex flex-col h-full bg-black border-r border-green-900/30 overflow-hidden font-mono text-[10px]">
      <div className="bg-green-900/20 px-3 py-2 border-b border-green-900/30 flex items-center justify-between">
        <span className="text-green-500 font-bold tracking-tighter uppercase">Raw Data Stream</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide select-none"
      >
        {logs.map((log, i) => (
          <div 
            key={i} 
            className={`terminal-text whitespace-nowrap border-l-2 pl-2 transition-all duration-300 ${
              i === 0 ? 'border-green-400 translate-x-1 opacity-100' : 'border-transparent opacity-60'
            }`}
          >
            {log}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-green-900 animate-pulse">WAITING FOR UPLINK...</div>
        )}
        <div className="w-2 h-4 bg-green-500 animate-blink inline-block" />
      </div>
      
      <div className="p-2 border-t border-green-900/20 bg-black/50 text-green-900 text-[8px] uppercase tracking-widest text-center">
        System 0.1.0-ALPHA // SECURED
      </div>
    </div>
  )
}
