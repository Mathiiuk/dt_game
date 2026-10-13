import React from 'react'
import { matchMarkers } from '../../domain/livePitch'
import { MATCH_MINUTES } from '../../domain/matchClock'
import { cn } from '../../lib/utils'

const KIND = { goal: 'bg-accent', yellow: 'bg-gold', red: 'bg-danger', sub: 'bg-fg-subtle' }
const LABEL = { goal: 'Gol', yellow: 'Amarilla', red: 'Roja', sub: 'Cambio' }

/** Línea de tiempo del partido: avanza con el minuto y deja marcados los goles, tarjetas y cambios (arriba el local, abajo la visita) */
export default function MatchProgress({ events = [], minute = 0 }) {
  const now = Math.min(MATCH_MINUTES, Math.max(0, minute))
  const pct = (m) => `${(m / MATCH_MINUTES) * 100}%`
  return (
    <div className="relative px-1 pb-5 pt-5" role="progressbar" aria-label="Minuto del partido" aria-valuemin={0} aria-valuemax={MATCH_MINUTES} aria-valuenow={now}>
      <div className="relative h-2 rounded-full bg-surface-3">
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-300" style={{ width: pct(now) }} />
        <span className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-fg-subtle/60" style={{ left: '50%' }} aria-hidden="true" />
        {matchMarkers(events, now).map((m, i) => (
          <span
            key={`${m.kind}-${m.minute}-${i}`}
            data-testid="progress-marker"
            title={`${LABEL[m.kind]} · ${m.minute}'`}
            className={cn('absolute size-3 -translate-x-1/2 rounded-full border-2 border-bg', KIND[m.kind], m.team === 'home' ? '-top-4' : 'top-3.5')}
            style={{ left: pct(m.minute) }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-semibold text-fg-subtle" aria-hidden="true">
        <span>0'</span><span>45'</span><span>{MATCH_MINUTES}'</span>
      </div>
    </div>
  )
}
