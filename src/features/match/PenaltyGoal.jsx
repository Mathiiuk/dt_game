import React, { useState } from 'react'
import { cn } from '../../lib/utils'

const ZONES = { L: 'Izquierda', C: 'Centro', R: 'Derecha' }

/**
 * Penal en contra: el arco con tres zonas. El DT toca hacia dónde se tira el arquero.
 * Es la misma decisión de siempre (izquierda, centro o derecha), pero se juega en el arco en vez de en una lista.
 * `options` son las opciones del momento; se elige la que tiene el `dive` de la zona tocada.
 */
export default function PenaltyGoal({ options, onChoose }) {
  const [picked, setPicked] = useState(null)
  const byDive = Object.fromEntries(options.filter(o => o.dive).map(o => [o.dive, o]))

  const choose = (dive) => {
    if (picked || !byDive[dive]) return
    setPicked(dive)
    // Un instante para ver al arquero tirarse antes de seguir
    setTimeout(() => onChoose(byDive[dive]), 650)
  }

  return (
    <div>
      <div className="relative mx-auto h-36 w-full max-w-xs overflow-hidden rounded-t-md border-x-4 border-t-4 border-fg bg-[repeating-linear-gradient(45deg,transparent_0_6px,oklch(100%_0_0/0.06)_6px_7px)]">
        <div className="grid h-full grid-cols-3">
          {Object.keys(ZONES).map(dive => (
            <button
              key={dive}
              type="button"
              onClick={() => choose(dive)}
              disabled={!!picked}
              aria-label={`Que se tire a la ${ZONES[dive].toLowerCase()}`}
              className={cn(
                'relative border-l border-line/40 first:border-l-0 transition-colors',
                picked === dive ? 'bg-accent/30' : 'hover:bg-accent-soft active:bg-accent/30',
                'disabled:cursor-default'
              )}
            >
              <span className="absolute inset-x-0 bottom-2 text-[0.6875rem] font-bold uppercase tracking-wider text-fg-muted">{ZONES[dive]}</span>
            </button>
          ))}
        </div>
        {/* Arquero: se queda en el medio hasta que el DT elige y entonces se tira */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute bottom-8 left-1/2 text-3xl transition-transform duration-500 ease-out',
            picked === 'L' && '-translate-x-[230%] -rotate-45',
            picked === 'R' && 'translate-x-[130%] rotate-45',
            !picked && '-translate-x-1/2'
          )}
        >
          🧤
        </span>
      </div>
      <p className="mt-2 text-center text-xs text-fg-subtle">Tocá la zona hacia donde se tira tu arquero. Si adivina, casi siempre la ataja.</p>
    </div>
  )
}
