import React, { useId, useState } from 'react'
import { CircleHelp } from 'lucide-react'
import { Progress } from '../../components/ui'
import { formatMoney } from '../../lib/format'
import { wageCapStatus, WAGE_CAP_EXPLAINER } from '../../domain/finances'
import { cn } from '../../lib/utils'

/** Masa salarial semanal contra el tope de la dirigencia: cuánto cobran jugadores y staff, cuánto margen queda y qué significa */
export default function WageCapMeter({ bill, cap, className }) {
  const status = wageCapStatus(bill, cap)
  const [open, setOpen] = useState(false)
  const helpId = useId()
  const textTone = status.tone === 'danger' ? 'text-danger' : status.tone === 'warning' ? 'text-warning' : 'text-fg-muted'

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm text-fg-muted">
        <span className="font-semibold text-fg">Masa salarial</span>
        <span className="num">{formatMoney(status.bill)} / {formatMoney(status.cap)}</span>
      </div>
      <Progress auto={false} tone={status.tone} value={status.barValue} label="Masa salarial contra el tope de la dirigencia" />
      <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
        <span className={cn('num font-semibold', textTone)}>
          {status.over ? `Te pasás ${formatMoney(status.overBy)}` : `Margen: ${formatMoney(status.margin)}`}
        </span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={helpId}
          onClick={() => setOpen(o => !o)}
          className="inline-flex items-center gap-1 text-fg-subtle underline-offset-2 hover:text-fg hover:underline"
        >
          <CircleHelp className="size-3.5" aria-hidden="true" />¿Qué es esto?
        </button>
      </div>
      {open && (
        <ul id={helpId} className="mt-2 space-y-1.5 rounded-lg border border-line bg-surface-2 p-3 text-xs leading-relaxed text-fg-muted">
          {WAGE_CAP_EXPLAINER.map(line => <li key={line}>{line}</li>)}
        </ul>
      )}
    </div>
  )
}
