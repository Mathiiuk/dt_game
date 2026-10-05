import React, { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { formatMoney } from '../../lib/format'
import { Button, Card, CardBody, Field, Input, ResponsiveOverlay, Stat } from '../../components/ui'

/** Contraoferta a un club comprador. La validación (monto mayor al ofrecido) vive aquí y se muestra junto al campo. */
export default function CounterOfferModal({ offer, onClose, onSend, processing = false }) {
  const [amount, setAmount] = useState(String(Math.round(offer.amount * 1.15)))
  const [error, setError] = useState('')

  const submit = () => {
    const value = parseInt(amount, 10)
    if (isNaN(value) || value <= offer.amount) {
      setError('La contraoferta debe superar la oferta inicial.')
      return
    }
    setError('')
    onSend(value)
  }

  const presets = [
    ['Probable', '+10%', Math.round(offer.amount * 1.1)],
    ['Exigente', '+20%', Math.round(offer.amount * 1.2)]
  ]

  return (
    <ResponsiveOverlay
      title={`Contraoferta por ${offer.players?.first_name} ${offer.players?.last_name}`}
      description={`Interesado: ${offer.from_club_name || 'club de IA'}`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button loading={processing} onClick={submit}>{!processing && <TrendingUp />}Enviar contraoferta</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Card as="div">
          <CardBody className="grid grid-cols-2 gap-4">
            <Stat label="Oferta inicial" value={formatMoney(offer.amount)} />
            <Stat label="Tolerancia estimada" value={formatMoney(Math.round(offer.amount * 1.25))} hint="hasta +25%" />
          </CardBody>
        </Card>

        <Field label="Nuevo monto exigido" error={error}>
          {(p) => <Input {...p} type="number" inputMode="numeric" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="num" />}
        </Field>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Montos sugeridos">
          {presets.map(([label, hint, value]) => (
            <Button key={label} type="button" variant="outline" size="sm" onClick={() => setAmount(String(value))}>
              {label} <span className="text-fg-subtle">{hint}</span>
            </Button>
          ))}
        </div>
      </div>
    </ResponsiveOverlay>
  )
}
