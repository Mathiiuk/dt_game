import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Compass } from 'lucide-react'
import { Button, Card, CardBody } from '../../components/ui'

/** "Tu próximo paso": una sola frase de qué conviene hacer ahora y, si hace falta, el botón para hacerlo */
export default function NextStepCard({ step, onDecide }) {
  const cta = step.cta
  return (
    <Card as="section" aria-labelledby="next-step-title" className="border-accent/30 bg-accent-soft/30">
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Compass className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
          <div className="min-w-0">
            <p className="eyebrow">Tu próximo paso</p>
            <h2 id="next-step-title" className="font-display text-xl font-semibold leading-tight text-fg">{step.title}</h2>
            <p className="mt-0.5 text-sm text-fg-muted">{step.body}</p>
          </div>
        </div>
        {cta?.to && <Button asChild className="w-full shrink-0 sm:w-auto"><Link to={cta.to}>{cta.label}<ArrowRight /></Link></Button>}
        {cta?.action === 'decide' && <Button onClick={onDecide} className="w-full shrink-0 sm:w-auto">{cta.label}<ArrowRight /></Button>}
      </CardBody>
    </Card>
  )
}
