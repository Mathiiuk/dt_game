import React, { useState } from 'react'
import { Check, Handshake } from 'lucide-react'
import { formatMoney } from '../../lib/format'
import { INSTALLMENT_SURCHARGE, installmentAmounts, offerPresets, payToday, validateOffer } from '../../domain/market'
import { Button, Card, CardBody, Field, Input, ResponsiveOverlay, Stat } from '../../components/ui'

const PLANS = [
  { id: 1, label: 'De contado' },
  { id: 3, label: '3 cuotas (+8%)' }
]

/**
 * Negociación del fichaje. El club vendedor responde a cada oferta (acepta, contraoferta o rechaza); hay hasta dos rondas y la
 * contraoferta de la segunda es final. Se puede pagar de contado o en 3 cuotas (40% hoy y dos cuotas semanales, con 8% más).
 * `onSubmit(monto, cuotas)` devuelve la respuesta del club (o null si el DT desistió del aviso previo).
 */
export default function OfferModal({ player, budget, wageInfo = null, onClose, onSubmit, processing = false }) {
  const asking = player.asking_price || player.market_value || 0
  const [installments, setInstallments] = useState(1)
  const [amount, setAmount] = useState(String(asking || 5000))
  const [error, setError] = useState('')
  const [reply, setReply] = useState(null)

  const send = async (value) => {
    const message = validateOffer(value, budget, installments)
    setError(message)
    if (message) return
    const res = await onSubmit(parseInt(value, 10), installments)
    if (res) setReply(res)
  }

  const choosePlan = (plan) => {
    // El precio pedido sube 8% si se paga en cuotas: el monto sugerido acompaña el cambio
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
      <div className="space-y-3 text-center" aria-live="polite">
        <Handshake className="mx-auto size-10 text-accent" aria-hidden="true" />
        <p className="text-base font-semibold text-fg">¡Acuerdo cerrado!</p>
        <p className="text-sm text-fg-muted">
          {player.first_name} {player.last_name} es nuevo jugador del club por {formatMoney(reply.price)}.
          {reply.installments === 3 && ` Pagaste ${formatMoney(reply.upfront)} hoy; el resto va en dos cuotas, una por semana.`}
        </p>
      </div>
    )
    footer = <Button onClick={onClose}>Listo</Button>
  } else if (reply?.status === 'REJECTED') {
    body = (
      <div className="space-y-2 text-center" aria-live="polite">
        <p className="text-base font-semibold text-danger">Negociación cerrada</p>
        <p className="text-sm text-fg-muted">{reply.message} No podés volver a ofertar por este jugador hasta la próxima ventana de pases.</p>
      </div>
    )
    footer = <Button variant="ghost" onClick={onClose}>Cerrar</Button>
  } else if (reply?.status === 'COUNTER') {
    body = (
      <div className="space-y-4" aria-live="polite">
        <Card as="div">
          <CardBody className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Ronda {reply.round} de 2</p>
            <p className="text-sm text-fg-muted">{player.clubs?.name || 'El agente'} responde: no cierran por ese monto, pero piden</p>
            <p className="num text-3xl font-semibold text-accent">{formatMoney(reply.counter)}</p>
            <p className="text-xs text-fg-subtle">
              {reply.final ? 'Es su última oferta: o la aceptás o se levantan de la mesa.' : 'Podés aceptarla o subir tu oferta una vez más.'}
            </p>
          </CardBody>
        </Card>
        {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        {!reply.final && (
          <Field label="Mejorar mi oferta">
            {(p) => <Input {...p} type="number" inputMode="numeric" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="num" />}
          </Field>
        )}
      </div>
    )
    footer = (
      <>
        <Button variant="ghost" onClick={onClose}>Retirarme</Button>
        {!reply.final && <Button variant="outline" loading={processing} onClick={() => send(amount)}>Enviar nueva oferta</Button>}
        <Button loading={processing} onClick={() => { setAmount(String(reply.counter)); send(String(reply.counter)) }}>
          {!processing && <Check />}Aceptar {formatMoney(reply.counter)}
        </Button>
      </>
    )
  } else {
    body = (
      <div className="space-y-5">
        <Card as="div">
          <CardBody className="grid grid-cols-2 gap-4">
            <Stat label="Precio pedido" value={formatMoney(askingNow)} valueClassName="text-2xl" />
            <Stat label="Tu presupuesto" value={formatMoney(budget)} valueClassName="text-2xl text-accent" />
          </CardBody>
        </Card>

        {wageInfo && (
          <p className="text-xs text-fg-muted" data-testid="wage-info">
            Si llega, cobra {formatMoney(wageInfo.newWage)} por semana (contrato de 3 años).
            {wageInfo.budget > 0 && (
              wageInfo.payroll + wageInfo.newWage > wageInfo.budget
                ? <strong className="text-warning"> Con él la masa salarial pasa a {formatMoney(wageInfo.payroll + wageInfo.newWage)} y te pasás del presupuesto de {formatMoney(wageInfo.budget)}.</strong>
                : ` La masa salarial quedaría en ${formatMoney(wageInfo.payroll + wageInfo.newWage)} de ${formatMoney(wageInfo.budget)}.`
            )}
          </p>
        )}

        <div role="radiogroup" aria-label="Forma de pago" className="flex gap-2">
          {PLANS.map(plan => (
            <Button key={plan.id} type="button" role="radio" aria-checked={installments === plan.id} variant={installments === plan.id ? 'primary' : 'outline'} size="sm" onClick={() => choosePlan(plan.id)}>
              {plan.label}
            </Button>
          ))}
        </div>

        <Field label="Monto de la oferta" error={error}>
          {(p) => <Input {...p} type="number" inputMode="numeric" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="num" />}
        </Field>

        {installments === 3 && validOffered && (
          <p className="text-xs text-fg-muted">
            Hoy pagás {formatMoney(payToday(offered, 3))}; después, dos cuotas de {formatMoney(firstInst)} y {formatMoney(secondInst)} (una por semana).
            Si la caja no alcanza cuando vence una cuota, se atrasa con 10% de recargo y la dirigencia lo anota.
          </p>
        )}

        <div className="flex flex-wrap gap-2" role="group" aria-label="Montos sugeridos">
          {offerPresets(askingNow).map(({ label, hint, amount: preset }) => (
            <Button key={label} type="button" variant="outline" size="sm" onClick={() => setAmount(String(preset))}>
              {label} <span className="text-fg-subtle">{hint}</span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-fg-subtle">El club puede contraofertar: hasta dos rondas. Si la oferta es una ofensa, se levantan de la mesa.</p>
      </div>
    )
    footer = (
      <>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button loading={processing} onClick={() => send(amount)}>{!processing && <Check />}Enviar oferta</Button>
      </>
    )
  }

  return (
    <ResponsiveOverlay
      title={`${player.first_name} ${player.last_name}`}
      description={`Negociación · ${player.clubs?.name || 'Agente libre'} · ${player.position}`}
      onClose={onClose}
      size="sm"
      footer={footer}
    >
      {body}
    </ResponsiveOverlay>
  )
}
