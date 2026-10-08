import React from 'react'
import { Calendar, DollarSign, Sparkles, TrendingUp, Users } from 'lucide-react'
import { Badge, Card, CardBody, Stat } from '../../components/ui'
import { formatMoney } from '../../lib/format'

export default function MarketHeader({
  budget = 0,
  wageBudgetWeekly = 0,
  currentPayroll = 0,
  marketStatus,
  candidatesCount = 0,
  totalCount = 0
}) {
  const isOpen = !!marketStatus?.isOpen
  const wageMargin = wageBudgetWeekly > 0 ? wageBudgetWeekly - currentPayroll : null

  return (
    <Card className="mb-6 border border-line bg-surface/90 shadow-sm">
      <CardBody className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          <Stat
            label="Caja disponible"
            value={formatMoney(budget)}
            valueClassName="text-2xl font-display font-bold text-accent sm:text-3xl"
            hint="Para fichajes y primas"
          />

          <Stat
            label="Margen salarial"
            value={wageMargin !== null ? formatMoney(Math.max(0, wageMargin)) : 'Ilimitado'}
            valueClassName="text-2xl font-display font-bold text-fg sm:text-3xl"
            hint={wageMargin !== null ? `${formatMoney(currentPayroll)} / sem en nómina` : 'Sin tope fijado'}
          />

          <Stat
            label="Candidatos"
            value={candidatesCount}
            hint={`de ${totalCount} en vidriera`}
            valueClassName="text-2xl font-display font-bold text-fg sm:text-3xl"
          />

          <div className="flex flex-col justify-center space-y-1">
            <span className="eyebrow text-fg-subtle">Libro de pases</span>
            <div className="flex items-center gap-2">
              <Badge tone={isOpen ? 'accent' : 'warning'} dot>
                {isOpen ? 'Abierto' : 'Cerrado'}
              </Badge>
            </div>
            <p className="text-xs text-fg-muted truncate">
              {marketStatus?.windowName || (isOpen ? 'Ventana activa' : 'Fuera de plazo')}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
