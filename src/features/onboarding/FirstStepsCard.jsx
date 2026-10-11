import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, Circle, X } from 'lucide-react'
import { Button, Card, CardBody, Progress } from '../../components/ui'
import { cn } from '../../lib/utils'

/** Misión inicial de las cuentas nuevas: tres pasos concretos con su avance. Se puede ocultar. */
export default function FirstStepsCard({ progress, onDismiss }) {
  // Plegada muestra solo el próximo paso (en el celular el Inicio no se llena); desplegada, los tres
  const [open, setOpen] = useState(false)
  const steps = open ? progress.steps : progress.steps.filter(step => !step.done).slice(0, 1)
  return (
    <Card as="section" aria-labelledby="first-steps-title" className="border-accent/40">
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="first-steps-title" className="font-display text-lg font-semibold text-fg">Tu primera misión</h2>
            <p className="text-sm text-fg-muted">{progress.done} de {progress.total} · tres pasos y ya sabés jugar.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Ocultar la misión inicial" className="-mr-2 -mt-1 shrink-0"><X /></Button>
        </div>
        <Progress value={Math.round((progress.done / progress.total) * 100)} label="Avance de la misión inicial" />
        <ol className="space-y-1">
          {steps.map(step => (
            <li key={step.id}>
              {step.done ? (
                <p className="flex min-h-11 items-center gap-3 text-sm text-fg-subtle line-through">
                  <Check className="size-5 shrink-0 text-accent" aria-hidden="true" /><span>{step.title}</span><span className="sr-only"> (hecho)</span>
                </p>
              ) : (
                <Link to={step.to} className={cn('flex min-h-11 items-start gap-3 rounded-md py-2 text-sm transition-colors hover:bg-surface-2')}>
                  <Circle className="mt-0.5 size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
                  <span className="min-w-0"><span className="block font-semibold text-fg">{step.title}</span><span className="block text-fg-muted">{step.hint}</span></span>
                </Link>
              )}
            </li>
          ))}
        </ol>
        <button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)} className="flex min-h-11 w-full items-center justify-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-fg">
          {open ? 'Ver solo el próximo' : 'Ver los tres pasos'}<ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>
      </CardBody>
    </Card>
  )
}
