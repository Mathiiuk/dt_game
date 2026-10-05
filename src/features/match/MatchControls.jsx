import React from 'react'
import { FastForward, Pause, Play } from 'lucide-react'
import { MATCH_SPEEDS } from '../../domain/matchClock'
import { cn } from '../../lib/utils'

/**
 * Controles del partido en vivo: pausa y reanudar, velocidad (x1 lento, x2, x4) y saltear el partido.
 * Saltear es una acción aparte de la velocidad y pide confirmación desde la pantalla.
 */
export default function MatchControls({ speed, onSpeed, paused, onTogglePause, onSkip }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={onTogglePause}
        aria-pressed={paused}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold transition-colors',
          paused ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-surface text-fg hover:bg-surface-3'
        )}
      >
        {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
        <span>{paused ? 'Reanudar' : 'Pausa'}</span>
      </button>

      <div role="radiogroup" aria-label="Velocidad del partido" className="flex items-center gap-1">
        {MATCH_SPEEDS.map(s => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={speed === s.id}
            title={s.hint}
            onClick={() => onSpeed(s.id)}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
              speed === s.id ? 'bg-accent text-accent-fg shadow-md shadow-emerald-950/40' : 'border border-line bg-surface text-fg-muted hover:text-fg'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="ml-1 flex items-center gap-1 rounded-lg border border-line bg-surface-3 px-3 py-1 text-xs font-bold text-fg transition-colors hover:bg-surface-2"
      >
        <FastForward className="size-3.5" aria-hidden="true" />
        <span>Saltear partido</span>
      </button>
    </div>
  )
}
