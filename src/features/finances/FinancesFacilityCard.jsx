import React from 'react'
import { Building, ShieldPlus, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription, CardFooter, Button, Badge } from '../../components/ui'
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
    <Card as="article" className="flex h-full flex-col border border-line bg-surface/90 shadow-sm hover:border-line-focus transition-all">
      <CardHeader className="pb-3 border-b border-line/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl bg-surface-3 text-accent border border-line">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle as="h3" className="text-base font-bold font-display text-fg">
                {facility.name}
              </CardTitle>
              <CardDescription className="text-xs">
                Nivel {level} · {extra}
              </CardDescription>
            </div>
          </div>
          <Badge tone="accent">Nv. {level}</Badge>
        </div>
      </CardHeader>

      <CardBody className="flex-1 p-4 space-y-3 text-xs">
        <p className="text-fg-muted leading-relaxed">
          {facility.description}
        </p>

        {/* Retorno de Inversión y Beneficio Estratégico */}
        <div className="rounded-xl bg-surface-2/70 p-3 border border-line space-y-1.5">
          <div className="flex items-center gap-1.5 text-accent font-semibold">
            <Sparkles className="size-3.5 shrink-0" />
            <span>Próximo nivel:</span>
          </div>
          <p className="text-fg font-medium">{roi.gainText}</p>
          <p className="text-fg-subtle italic text-[11px] border-t border-line/60 pt-1 mt-1">
            {roi.paybackText}
          </p>
        </div>
      </CardBody>

      <CardFooter className="pt-2 border-t border-line/60">
        <Button
          className="w-full text-xs font-semibold"
          variant="outline"
          disabled={!canPay}
          onClick={() => onUpgrade(facility)}
        >
          {facility.action} · {formatMoney(cost)}
        </Button>
      </CardFooter>
    </Card>
  )
}
