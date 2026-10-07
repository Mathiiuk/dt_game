import React from 'react'
import { FastForward, Pause, Play, Users, MessageCircle } from 'lucide-react'
import { MATCH_SPEEDS } from '../../domain/matchClock'
import { cn } from '../../lib/utils'
import { useIsDesktop } from '../../hooks/useMediaQuery'

export default function MatchActions({ 
  speed, 
  onSpeed, 
  paused, 
  onTogglePause, 
  onOpenSubs, 
  onOpenShouts,
  onSkip
}) {
  const isDesktop = useIsDesktop()

  return (
    <div className={cn(
      "flex flex-wrap items-center justify-between gap-2",
      !isDesktop && "fixed bottom-0 inset-x-0 p-4 bg-surface/90 backdrop-blur-md border-t border-line z-40 pb-safe"
    )}>
      {/* Controles de reproducci�n */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePause}
          aria-pressed={paused}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl border p-3 sm:px-4 sm:py-2 text-sm font-bold transition-colors min-h-[48px] sm:min-h-0',
            paused ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-surface text-fg hover:bg-surface-3'
          )}
        >
          {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          <span className="hidden sm:inline">{paused ? 'Reanudar' : 'Pausa'}</span>
        </button>

        <div role="radiogroup" aria-label="Velocidad del partido" className="flex items-center gap-1 border border-line rounded-xl p-1 bg-surface-2 min-h-[48px] sm:min-h-0">
          {MATCH_SPEEDS.map(s => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={speed === s.id}
              title={s.hint}
              onClick={() => onSpeed(s.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-bold transition-all min-h-[40px] sm:min-h-0',
                speed === s.id ? 'bg-accent text-accent-fg shadow-md shadow-emerald-950/40' : 'text-fg-muted hover:text-fg'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Acciones del DT */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSubs}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-3 p-3 sm:px-4 sm:py-2 text-sm font-bold text-fg transition-colors hover:bg-surface-2 min-h-[48px] sm:min-h-0"
        >
          <Users className="w-5 h-5" />
          <span className="hidden sm:inline">Cambios</span>
        </button>
        
        <button
          type="button"
          onClick={onOpenShouts}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-3 p-3 sm:px-4 sm:py-2 text-sm font-bold text-fg transition-colors hover:bg-surface-2 min-h-[48px] sm:min-h-0"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Gritos</span>
        </button>

        {onSkip && isDesktop && (
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-surface-3 px-4 py-2 text-sm font-bold text-fg transition-colors hover:bg-surface-2"
          >
            <FastForward className="w-4 h-4" />
            <span>Saltear</span>
          </button>
        )}
      </div>
    </div>
  )
}
