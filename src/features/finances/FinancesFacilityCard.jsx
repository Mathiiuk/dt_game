import React from 'react'
import { Building, ShieldPlus, ShoppingBag } from 'lucide-react'
import { Card, CardBody, Button, Badge } from '../../components/ui'
import { formatMoney } from '../../lib/format'
import { getFacilityROI, levelOf, storeWeeklyIncome, upgradeCost } from '../../domain/finances'

const FACILITY_ICONS = {
  stadium_level: Building,
  medical_level: ShieldPlus,
  store_level: ShoppingBag
}

export default function FinancesFacilityCard({ facility, club, onUpgrade, budget = 0 }) {
  const Icon = FACILITY_ICONS[facility.key] || Building
  const level = levelOf(club, facility.key)
  const cost = upgradeCost(facility, level)
  const roi = getFacilityROI(facility.key, level, cost)

  const extra = facility.key === 'stadium_level'
    ? `Capacidad ${Number(club?.stadium_capacity || 1000).toLocaleString('es-AR')}`
    : facility.key === 'store_level'
    ? `+${formatMoney(storeWeeklyIncome(level))}/sem`
    : 'Recuperación pasiva'

  const canPay = budget >= cost

  return (
    <Card as="article" className="h-full">
      <CardBody className="space-y-2 p-3">
        <div className="flex items-center gap-2.5">
          <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 className="font-slab text-sm font-bold text-fg">{facility.name}</h3>
            <p className="text-xs text-fg-muted">Nivel {level} · {extra}</p>
          </div>
          <Badge tone="accent">Nv. {level}</Badge>
        </div>
        <p className="text-xs font-medium text-fg"><span className="text-accent">Próximo nivel:</span> {roi.gainText}</p>
        <details className="text-xs text-fg-muted">
          <summary className="cursor-pointer text-fg-subtle hover:text-fg">Ver detalle</summary>
          <p className="mt-1 leading-relaxed">{facility.description}</p>
          <p className="mt-1 italic text-fg-subtle">{roi.paybackText}</p>
        </details>
        <Button className="w-full text-xs font-semibold" variant="outline" disabled={!canPay} onClick={() => onUpgrade(facility)}>
          {facility.action} · {formatMoney(cost)}
        </Button>
      </CardBody>
    </Card>
  )
}
