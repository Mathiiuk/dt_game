import React, { useState } from 'react'
import { Tag } from 'lucide-react'
import { formatMoney } from '../../lib/format'
import { Button, Card, CardBody, Field, Input, ResponsiveOverlay, Stat } from '../../components/ui'

/** Gestión de venta: precio pedido y lista de transferibles. Diálogo en escritorio, página completa en móvil. */
export default function SellPlayerModal({ player, onClose, onSave, processing = false }) {
  const base = player.market_value || 15000
  const [price, setPrice] = useState(player.asking_price ? String(player.asking_price) : String(base))

  const presets = [
    ['Rápida', '−10%', Math.round(base * 0.9)],
    ['Justa', '100%', base],
    ['Cotizada', '+25%', Math.round(base * 1.25)]
  ]

  return (
    <ResponsiveOverlay
      title={`${player.first_name} ${player.last_name}`}
      description={`Gestión de venta · ${player.position} · ${player.age} años`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" disabled={processing} onClick={() => onSave(false, 0)}>No transferible</Button>
          <Button loading={processing} onClick={() => onSave(true, parseInt(price, 10) || 0)}>{!processing && <Tag />}Poner en lista</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Card as="div">
          <CardBody className="grid grid-cols-2 gap-4">
            <Stat label="Valor de mercado" value={formatMoney(base)} />
            <Stat label="Salario actual" value={formatMoney(player.contract_salary || 500)} hint="por semana" />
          </CardBody>
        </Card>

        <Field label="Precio pedido">
          {(p) => <Input {...p} type="number" inputMode="numeric" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej: 25000" className="num" />}
        </Field>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Precios sugeridos">
          {presets.map(([label, hint, amount]) => (
            <Button key={label} type="button" variant="outline" size="sm" onClick={() => setPrice(String(amount))}>
              {label} <span className="text-fg-subtle">{hint}</span>
            </Button>
          ))}
        </div>
      </div>
    </ResponsiveOverlay>
  )
}
