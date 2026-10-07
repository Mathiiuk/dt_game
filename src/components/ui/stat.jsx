import React from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Dato destacado: rótulo, cifra grande en tipografía de titulares y, opcionalmente, variación.
 * `delta` positivo/negativo se muestra con flecha y color semántico (nunca sólo con color).
 */
export function Stat({ label, value, hint, delta, className, valueClassName }) {
  const hasDelta = typeof delta === 'number' && delta !== 0
  const up = hasDelta && delta > 0

  return (
    <div className={cn('min-w-0', className)}>
      <p className="eyebrow truncate">{label}</p>
      <p className={cn('num mt-1 truncate font-display text-3xl font-semibold leading-none text-fg', valueClassName)}>{value}</p>
      {(hint || hasDelta) && (
        <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-fg-muted">
          {hasDelta && (
            <span className={cn('inline-flex shrink-0 items-center gap-0.5 font-semibold', up ? 'text-accent' : 'text-danger')}>
              {up ? <ArrowUpRight className="size-3.5" aria-hidden="true" /> : <ArrowDownRight className="size-3.5" aria-hidden="true" />}
              <span className="num">{up ? '+' : ''}{delta}</span>
              <span className="sr-only">{up ? 'sube' : 'baja'}</span>
            </span>
          )}
          <span className="truncate">{hint}</span>
        </p>
      )}
    </div>
  )
}
