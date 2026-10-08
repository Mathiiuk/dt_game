import React, { useState } from 'react'
import { AlertCircle, Check, Handshake, MessageSquare, Sparkles, User, X } from 'lucide-react'
import { formatMoney } from '../../lib/format'
import {
  INSTALLMENT_SURCHARGE,
  installmentAmounts,
  offerPresets,
  payToday,
  validateOffer,
  getRepresentativeProfile
} from '../../domain/market'
import { Button, Card, CardBody, Field, Input, ResponsiveOverlay, Stat } from '../../components/ui'

const PLANS = [
  { id: 1, label: 'De contado' },
  { id: 3, label: '3 cuotas (+8%)' }
]

/**
 * Negociación conversacional de fichajes estilo arcade (Chat con el Representante).
 * Mantiene compatibilidad total con validación de cuotas, rondas de contraoferta y límites salariales.
 */
export default function OfferModal({
  player,
  budget,
  wageInfo = null,
  onClose,
  onSubmit,
  processing = false
}) {
  const asking = player.asking_price || player.market_value || 0
  const [installments, setInstallments] = useState(1)
  const [amount, setAmount] = useState(String(asking || 5000))
  const [error, setError] = useState('')
  const [reply, setReply] = useState(null)

  const rep = getRepresentativeProfile(player)

  const send = async (value) => {
    const message = validateOffer(value, budget, installments)
    setError(message)
    if (message) return
    const res = await onSubmit(parseInt(value, 10), installments)
    if (res) setReply(res)
  }

  const choosePlan = (plan) => {
    const base = plan === 3 ? Math.round(asking * INSTALLMENT_SURCHARGE) : asking
    setInstallments(plan)
    setAmount(String(base || 5000))
    setError('')
  }

  const mult = installments === 3 ? INSTALLMENT_SURCHARGE : 1
  const askingNow = Math.round(asking * mult)
  const offered = parseInt(amount, 10)
  const validOffered = Number.isFinite(offered) && offered > 0
  const [firstInst, secondInst] = validOffered ? installmentAmounts(offered) : [0, 0]

  let body
  let footer

  if (reply?.status === 'ACCEPTED') {
    body = (
      <div className="space-y-4 text-center py-2" aria-live="polite">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30 shadow-lg">
          <Handshake className="size-8" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="font-display text-xl font-black text-fg">¡Acuerdo cerrado!</p>
          <p className="text-sm text-fg-muted">
            <span className="font-semibold text-fg">{player.first_name} {player.last_name}</span> es nuevo jugador del club por {formatMoney(reply.price)}.
            {reply.installments === 3 && ` Pagaste ${formatMoney(reply.upfront)} hoy; el resto va en dos cuotas, una por semana.`}
          </p>
        </div>

        {/* Cita de cierre del representante */}
        <div className="rounded-xl bg-surface-2/80 border border-line p-3 text-xs text-left flex items-start gap-2.5">
          <span className="text-xl" aria-hidden="true">{rep.avatar}</span>
          <div>
            <span className="font-bold text-fg">{rep.name}:</span>
            <p className="text-fg-subtle italic mt-0.5">
              "¡Tenemos trato, DT! Un gusto hacer negocios con gente de palabra. El muchacho se pone la camiseta y rinde."
            </p>
          </div>
        </div>

        {reply.commission > 0 && (
          <p className="text-xs text-fg-subtle">
            Comisión del representante: {formatMoney(reply.commission)} ({Math.round((reply.commission_rate || 0) * 1000) / 10}%).
          </p>
        )}
      </div>
    )
    footer = <Button onClick={onClose} className="w-full">Listo</Button>
  } else if (reply?.status === 'REJECTED') {
    body = (
      <div className="space-y-4 text-center py-2" aria-live="polite">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger/15 text-danger border border-danger/30">
          <AlertCircle className="size-8" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="font-display text-xl font-bold text-danger">Negociación cerrada</p>
          <p className="text-sm text-fg-muted">
            {reply.message} No podés volver a ofertar por este jugador hasta la próxima ventana de pases.
          </p>
        </div>

        <div className="rounded-xl bg-surface-2/80 border border-line p-3 text-xs text-left flex items-start gap-2.5">
          <span className="text-xl" aria-hidden="true">{rep.avatar}</span>
          <div>
            <span className="font-bold text-fg">{rep.name}:</span>
            <p className="text-fg-subtle italic mt-0.5">
              "Con esa oferta me hacés perder el tiempo, DT. Así no se negocia con profesionales."
            </p>
          </div>
        </div>
      </div>
    )
    footer = <Button variant="ghost" onClick={onClose} className="w-full">Cerrar</Button>
  } else if (reply?.status === 'COUNTER') {
    body = (
      <div className="space-y-4" aria-live="polite">
        {/* Burbuja de contraoferta del representante */}
        <div className="rounded-2xl bg-surface-2 border border-line p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">{rep.avatar}</span>
            <div>
              <p className="text-xs font-bold text-fg">{rep.name} <span className="text-fg-subtle font-normal">(Representante)</span></p>
              <p className="text-[10px] uppercase font-bold text-accent tracking-wider">Ronda {reply.round} de 2</p>
            </div>
          </div>
          <p className="text-xs text-fg-muted italic pl-7">
            "Mirá, tu propuesta inicial no llega. {player.clubs?.name || 'El agente'} responde: no cierran por ese monto, pero piden:"
          </p>
          <div className="pl-7">
            <p className="num text-3xl font-display font-black text-accent">{formatMoney(reply.counter)}</p>
            <p className="text-xs text-fg-subtle mt-0.5">
              {reply.final
                ? 'Es su última oferta: o la aceptás o se levantan de la mesa.'
                : 'Podés aceptarla o subir tu oferta una vez más.'}
            </p>
          </div>
        </div>

        {error && <p role="alert" className="text-xs text-danger font-medium">{error}</p>}

        {!reply.final && (
          <Field label="Mejorar mi oferta">
            {(p) => (
              <Input
                {...p}
                type="number"
                inputMode="numeric"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="num text-base font-semibold"
              />
            )}
          </Field>
        )}
      </div>
    )
    footer = (
      <div className="flex flex-wrap items-center justify-end gap-2 w-full">
        <Button variant="ghost" onClick={onClose}>Retirarme</Button>
        {!reply.final && (
          <Button variant="outline" loading={processing} onClick={() => send(amount)}>
            Enviar nueva oferta
          </Button>
        )}
        <Button
          loading={processing}
          onClick={() => {
            setAmount(String(reply.counter))
            send(String(reply.counter))
          }}
        >
          {!processing && <Check className="size-4" />}
          Aceptar {formatMoney(reply.counter)}
        </Button>
      </div>
    )
  } else {
    body = (
      <div className="space-y-4">
        {/* 1. Burbuja de Diálogo Arcade del Representante */}
        <div className="rounded-2xl bg-surface-2/90 border border-line p-3.5 flex items-start gap-3 shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/25 text-xl">
            {rep.avatar}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs text-fg">{rep.name}</span>
              <span className="text-[10px] text-fg-subtle">• Agente de {player.last_name}</span>
            </div>
            <p className="text-xs text-fg-muted italic leading-relaxed">
              "{rep.openingQuote}"
            </p>
          </div>
        </div>

        {/* 2. Resumen Económico */}
        <Card as="div" className="border border-line/80">
          <CardBody className="grid grid-cols-2 gap-3 p-3">
            <Stat label="Precio pedido" value={formatMoney(askingNow)} valueClassName="text-xl font-bold font-display" />
            <Stat label="Tu presupuesto" value={formatMoney(budget)} valueClassName="text-xl font-bold font-display text-accent" />
          </CardBody>
        </Card>

        {/* 3. Información Salarial y Margen */}
        {wageInfo && (
          <p className="text-xs text-fg-muted bg-surface-2/50 border border-line/50 rounded-lg p-2.5" data-testid="wage-info">
            Si llega, cobra {formatMoney(wageInfo.newWage)} por semana (contrato de {wageInfo.years || 3} años).
            {wageInfo.budget > 0 && (
              wageInfo.payroll + wageInfo.newWage > wageInfo.budget
                ? <strong className="text-warning"> Con él la masa salarial pasa a {formatMoney(wageInfo.payroll + wageInfo.newWage)} y te pasás del presupuesto de {formatMoney(wageInfo.budget)}.</strong>
                : ` La masa salarial quedaría en ${formatMoney(wageInfo.payroll + wageInfo.newWage)} de ${formatMoney(wageInfo.budget)}.`
            )}
          </p>
        )}

        {/* 4. Selector de Cuotas / Financiación */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-fg-subtle">Forma de pago</label>
          <div role="radiogroup" aria-label="Forma de pago" className="flex gap-2">
            {PLANS.map((plan) => (
              <Button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={installments === plan.id}
                variant={installments === plan.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => choosePlan(plan.id)}
                className="flex-1 text-xs"
              >
                {plan.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 5. Campo de Monto a Ofertar */}
        <Field label="Monto de la oferta" error={error}>
          {(p) => (
            <Input
              {...p}
              type="number"
              inputMode="numeric"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="num text-base font-semibold"
            />
          )}
        </Field>

        {installments === 3 && validOffered && (
          <p className="text-xs text-fg-muted bg-surface-2/40 border border-line/40 rounded-lg p-2">
            Hoy pagás {formatMoney(payToday(offered, 3))}; después, dos cuotas de {formatMoney(firstInst)} y {formatMoney(secondInst)} (una por semana).
            Si la caja no alcanza cuando vence una cuota, se atrasa con 10% de recargo y la dirigencia lo anota.
          </p>
        )}

        {/* 6. Botones de Oferta Rápida (Presets) */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-fg-subtle">Ofertas rápidas</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Montos sugeridos">
            {offerPresets(askingNow).map(({ label, hint, amount: preset }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(preset))}
                className="text-xs"
              >
                {label} <span className="text-fg-subtle text-[11px]">({hint})</span>
              </Button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-fg-subtle leading-relaxed">
          El club puede contraofertar: hasta dos rondas. Si la oferta es una ofensa, se levantan de la mesa. Además se paga la comisión del representante (de 4% a 15% del precio).
        </p>
      </div>
    )
    footer = (
      <div className="flex items-center justify-end gap-2 w-full">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button loading={processing} onClick={() => send(amount)}>
          {!processing && <Check className="size-4" />}
          Enviar oferta
        </Button>
      </div>
    )
  }

  return (
    <ResponsiveOverlay
      open
      onClose={onClose}
      title={`${player.first_name} ${player.last_name}`}
      description={`Posición: ${player.position} · ${player.clubs?.name || 'Agente libre'}`}
      footer={footer}
    >
      {body}
    </ResponsiveOverlay>
  )
}
