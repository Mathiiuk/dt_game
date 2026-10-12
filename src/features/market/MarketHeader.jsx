import React from 'react'
import { DataStrip } from '../../components/ui'
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
    <DataStrip label="Resumen del mercado" items={[
      { label: 'Caja disponible', value: formatMoney(budget), hint: 'para fichajes y primas' },
      { label: 'Margen salarial', value: wageMargin !== null ? formatMoney(Math.max(0, wageMargin)) : 'Ilimitado', hint: wageMargin !== null ? `${formatMoney(currentPayroll)}/sem en nómina` : 'sin tope fijado' },
      { label: 'Candidatos', value: String(candidatesCount), hint: `de ${totalCount} en vidriera` },
      { label: 'Libro de pases', value: isOpen ? 'Abierto' : 'Cerrado', tone: isOpen ? 'good' : 'warn', hint: marketStatus?.windowName || (isOpen ? 'ventana activa' : 'fuera de plazo') }
    ]} />
  )
}
