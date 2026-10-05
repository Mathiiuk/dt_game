import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { formatMoney } from '../../lib/format'
import { offerPresets, validateOffer } from '../../domain/market'
import { Button, Card, CardBody, Field, Input, ResponsiveOverlay, Stat } from '../../components/ui'

/** Oferta de fichaje. Diálogo en escritorio, página completa en móvil; el error de monto aparece junto al campo. */
export default function OfferModal({ player, budget, onClose, onConfirm, processing = false }) {
  const value = player.market_value || 0
  const [amount, setAmount] = useState(String(value || 50000))
  const [error, setError] = useState('')

  const submit = () => {
    const message = validateOffer(amount, budget)
    setError(message)
    if (!message) onConfirm(parseInt(amount, 10))
  }

  return (
    <ResponsiveOverlay
      title={`${player.first_name} ${player.last_name}`}
      description={`Oferta de fichaje · ${player.clubs?.name || 'Agente libre'} · ${player.position}`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button loading={processing} onClick={submit}>{!processing && <Check />}Enviar oferta</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Card as="div">
          <CardBody className="grid grid-cols-2 gap-4">
            <Stat label="Valor de mercado" value={formatMoney(value)} valueClassName="text-2xl" />
            <Stat label="Tu presupuesto" value={formatMoney(budget)} valueClassName="text-2xl text-accent" />
          </CardBody>
        </Card>

        <Field label="Monto de la oferta" error={error}>
          {(p) => <Input {...p} type="number" inputMode="numeric" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="num" />}
        </Field>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Montos sugeridos">
          {offerPresets(value).map(({ label, hint, amount: preset }) => (
            <Button key={label} type="button" variant="outline" size="sm" onClick={() => setAmount(String(preset))}>
              {label} <span className="text-fg-subtle">{hint}</span>
            </Button>
          ))}
        </div>
      </div>
    </ResponsiveOverlay>
  )
}
