import React from 'react'
import { AlertCircle, Briefcase, Calendar, Check, Target } from 'lucide-react'
import { formatMoney } from '../../lib/format'
import { Badge, Button, Card, CardBody, ResponsiveOverlay, Stat } from '../../components/ui'

const OBJECTIVES = {
  CHAMPION: 'Salir campeón del torneo',
  PROMOTION: 'Lograr el ascenso de categoría',
  TOP_HALF: 'Clasificar al reducido',
  MID_TABLE: 'Mitad de tabla cómoda',
  AVOID_RELEGATION: 'Evitar el descenso'
}

/** Oferta laboral de otro club. Antes era un bottom sheet; ahora diálogo en escritorio y página completa en móvil. */
export default function JobOfferBottomSheet({ isOpen, offer, onClose, onAccept, onReject, loading = false }) {
  if (!isOpen || !offer) return null

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

        <div role="note" className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-fg-muted">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>Al firmar, termina tu ciclo en el club actual y asumes de inmediato el mando de <strong className="font-semibold text-fg">{offer.clubName}</strong>.</span>
        </div>
      </div>
    </ResponsiveOverlay>
  )
}
