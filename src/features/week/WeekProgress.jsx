import React from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays } from 'lucide-react'
import { Button } from '../../components/ui'
import { WEEK_DAYS, dayAt, phraseAt } from '../../domain/weekFlavor'
import { cn } from '../../lib/utils'

const TONE = { accent: 'text-accent', danger: 'text-danger', neutral: 'text-fg' }

/**
 * "La semana pasa": mientras se procesa, una línea de tiempo lunes→domingo y frases que rotan;
 * al terminar, un resumen corto de lo que cambió. Con "menos movimiento" no se anima (lo resuelve el CSS global).
 */
export default function WeekProgress({ visible, tick, summary, onClose }) {
  if (!visible) return null
  const done = Array.isArray(summary)
  const current = done ? WEEK_DAYS.length - 1 : dayAt(tick)

  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center bg-bg/95 px-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="La semana pasa">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
          <CalendarDays className={cn('size-7', !done && 'animate-pulse')} aria-hidden="true" />
        </div>

        <ol className="flex items-center justify-between gap-1" aria-label="Días de la semana">
          {WEEK_DAYS.map((day, i) => (
            <li key={day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5" aria-current={i === current ? 'step' : undefined}>
              <span className={cn('size-3 rounded-full border transition-all duration-500', i < current || done ? 'border-accent bg-accent' : i === current ? 'scale-125 border-accent bg-accent/60 shadow-[0_0_0_4px_var(--color-accent-soft)]' : 'border-line-strong bg-surface-2')} />
              <span className={cn('text-[0.7rem] font-semibold uppercase tracking-wider', i <= current ? 'text-fg' : 'text-fg-subtle')}>{day}</span>
            </li>
          ))}
        </ol>

        {done ? (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-fg">Semana completada</h2>
            <ul className="space-y-1.5 text-sm">
              {summary.map(line => <li key={line.id} className={cn('font-medium', TONE[line.tone] || 'text-fg')}>{line.text}</li>)}
            </ul>
            <Button className="w-full" onClick={onClose}>Seguir</Button>
          </div>
        ) : (
          <p role="status" aria-live="polite" className="min-h-6 text-base font-medium text-fg-muted">{phraseAt(tick)}…</p>
        )}
      </div>
    </div>,
    document.body
  )
}
