import React, { useEffect, useRef } from 'react'

export default function MatchTimeline({ events, matchState }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  return (
    <div 
      className="flex-1 bg-surface-2 border border-line rounded-xl p-4 overflow-y-auto min-h-[300px] flex flex-col custom-scrollbar shadow-inner"
      ref={scrollRef}
      aria-live="polite"
    >
      {events.length > 0 && (
        <div className="space-y-3 flex-1 flex flex-col justify-end">
          {events.map((e, idx) => {
            const isGoal = e.text.includes('�GOL') || e.text.includes('anota')
            const isCard = e.text.includes('amarilla') || e.text.includes('roja') || e.text.includes('lesiona')
            const isShout = e.text.startsWith('DT:')
            return (
              <div 
                key={idx} 
                className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                  isGoal 
                    ? 'bg-accent-soft border-accent/50 text-accent font-bold'
                    : isCard
                    ? 'bg-danger-soft border-danger/40 text-danger'
                    : isShout
                    ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300 italic'
                    : 'bg-bg/60 border-line text-fg'
                }`}
              >
                <span className="text-fg-subtle font-mono font-bold shrink-0 text-sm">{e.minute}'</span>
                <span className="leading-relaxed text-sm">{e.text}</span>
              </div>
            )
          })}
        </div>
      )}

      {events.length === 0 && matchState !== 'pre-match' && (
        <div className="h-full flex items-center justify-center text-center text-fg-subtle text-sm italic">
          Bal�n en disputa, equipos midiendo fuerzas en el campo...
        </div>
      )}

      {events.length === 0 && matchState === 'pre-match' && (
        <div className="h-full flex items-center justify-center text-center text-fg-subtle text-sm italic">
          Equipos en vestuarios finalizando la charla t�ctica.
        </div>
      )}
    </div>
  )
}
