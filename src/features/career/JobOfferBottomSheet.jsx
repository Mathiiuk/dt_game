import React, { useState } from 'react'
import { AlertCircle, Briefcase, Calendar, Check, Target } from 'lucide-react'
import { formatMoney } from '../../lib/format'
import { Badge, Button, Card, CardBody, Input, ResponsiveOverlay, Stat } from '../../components/ui'
import { JOB_MAX_ROUNDS } from '../../domain/jobNegotiation'

const OBJECTIVES = {
  CHAMPION: 'Salir campeón del torneo',
  PROMOTION: 'Lograr el ascenso de categoría',
  TOP_HALF: 'Terminar en la mitad de arriba',
  MID_TABLE: 'Mitad de tabla cómoda',
  AVOID_RELEGATION: 'Evitar el descenso'
}

/** Oferta laboral de otro club. Antes era un bottom sheet; ahora diálogo en escritorio y página completa en móvil. */
const reply = (r) => ({
  ACCEPTED: `El club aceptó: tu sueldo queda en ${formatMoney(r.wage)} por semana.`,
  COUNTER: `El club contraofertó ${formatMoney(r.wage)}: es lo máximo que puede pagar. Podés firmar así o hacer un último pedido.`,
  FINAL: `El club no se mueve de ${formatMoney(r.wage)}. Es tomar o dejar.`,
  WITHDRAWN: 'Te pasaste: la dirigencia se ofendió y retiró la oferta.',
  INVALID: 'Pedí un sueldo mayor al que te ofrecen.',
  CLOSED: 'Ya no hay más rondas de negociación.'
}[r.status] || '')

export default function JobOfferBottomSheet({ isOpen, offer, onClose, onAccept, onReject, onNegotiate, loading = false }) {
  const [ask, setAsk] = useState('')
  const [answer, setAnswer] = useState('')
  const [negotiating, setNegotiating] = useState(false)
  if (!isOpen || !offer) return null

  const canNegotiate = Boolean(onNegotiate && offer.id) && (offer.negotiationRounds || 0) < JOB_MAX_ROUNDS
  const askNumber = Number(ask)
  const submitAsk = async () => {
    setNegotiating(true)
    try {
      const r = await onNegotiate(offer, askNumber)
      setAnswer(reply(r))
      setAsk('')
    } finally {
      setNegotiating(false)
    }
  }

  const years = offer.contractDurationYears || 1

  return (
    <ResponsiveOverlay
      title={offer.clubName}
      description={`${offer.tierName || `Tier ${offer.tier}`} · vence en ${offer.weeksRemaining || 2} semanas`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" disabled={loading} onClick={() => onReject(offer)}>Desestimar oferta</Button>
          <Button loading={loading} onClick={() => onAccept(offer)}>{!loading && <Check />}Firmar contrato</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Badge tone="accent" dot><Briefcase className="size-3" aria-hidden="true" />Propuesta laboral</Badge>

        <Card as="div">
          <CardBody className="grid grid-cols-2 gap-5">
            <Stat label="Sueldo semanal" value={formatMoney(offer.offeredSalary)} />
            <Stat label="Presupuesto de fichajes" value={formatMoney(offer.budget)} />
            <div className="min-w-0">
              <p className="eyebrow flex items-center gap-1.5"><Target className="size-3.5" aria-hidden="true" />Objetivo</p>
              <p className="mt-1.5 text-sm font-semibold text-fg">{OBJECTIVES[offer.objective] || 'Objetivo institucional equilibrado'}</p>
            </div>
            <div className="min-w-0">
              <p className="eyebrow flex items-center gap-1.5"><Calendar className="size-3.5" aria-hidden="true" />Duración</p>
              <p className="mt-1.5 text-sm font-semibold text-fg">{years} {years === 1 ? 'año' : 'años'}</p>
            </div>
          </CardBody>
        </Card>

        {canNegotiate && (
          <section aria-label="Negociar el sueldo" className="space-y-2 rounded-lg border border-line bg-surface-2 p-4">
            <p className="text-sm font-semibold text-fg">Negociar el sueldo <span className="font-normal text-fg-muted">({offer.negotiationRounds || 0} de {JOB_MAX_ROUNDS} rondas usadas)</span></p>
            <div className="flex items-end gap-2">
              <label className="flex-1 text-xs text-fg-muted">
                Sueldo semanal que pedís
                <Input type="number" inputMode="numeric" min="0" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={String(Math.round(offer.offeredSalary * 1.1))} />
              </label>
              <Button variant="secondary" loading={negotiating} disabled={negotiating || !(askNumber > offer.offeredSalary)} onClick={submitAsk}>Negociar</Button>
            </div>
            {answer && <p role="status" className="text-sm text-fg">{answer}</p>}
          </section>
        )}

        <div role="note" className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-fg-muted">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>Al firmar, termina tu ciclo en el club actual y asumes de inmediato el mando de <strong className="font-semibold text-fg">{offer.clubName}</strong>.</span>
        </div>
      </div>
    </ResponsiveOverlay>
  )
}
