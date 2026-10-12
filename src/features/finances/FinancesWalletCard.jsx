import React from 'react'
import { CheckCircle2, Info } from 'lucide-react'
import { Card, CardBody, Kicker, Button, DataStrip } from '../../components/ui'
import { formatMoney } from '../../lib/format'
import { getTycoonHealth } from '../../domain/finances'

export default function FinancesWalletCard({ finances, check = null, checking = false, onVerify }) {
  const balance = finances?.balance || 0
  const net = finances?.netWeeklyFlow || 0
  const totalExpenses = finances?.expenses?.total || 0
  const profitable = net >= 0
  const tycoonHealth = getTycoonHealth(finances?.healthStatus, balance, totalExpenses)

  return (
    <Card masthead as="section" aria-label="Billetera del club">
      <CardBody className="space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Kicker>Billetera del club</Kicker>
          <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${tycoonHealth.badgeClass}`}>{tycoonHealth.slogan}</span>
        </div>

        <DataStrip label="Caja y balance semanal" items={[
          { label: 'Caja hoy', value: formatMoney(balance), tone: balance < 0 ? 'bad' : 'neutral' },
          { label: 'Balance semanal', value: `${profitable ? '+' : ''}${formatMoney(net)}`, tone: profitable ? 'good' : 'bad', hint: profitable ? 'superávit' : 'déficit cubierto' },
          { label: 'Autonomía', value: String(finances?.liquidityWeeks || tycoonHealth.runwayWeeks).replace(/\s*semanas? de margen/, ' sem.') }
        ]} />

        {onVerify && (
          <div className="flex flex-wrap items-start gap-3">
            <Button size="sm" variant="outline" onClick={onVerify} loading={checking}>{!checking && <CheckCircle2 />}Verificar balance</Button>
            {check && (
              <p role="status" className={`flex min-w-0 flex-1 items-start gap-2 text-xs leading-relaxed ${check.status === 'OK' ? 'text-accent' : 'text-fg-muted'}`}>
                {check.status === 'OK' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
                <span>{check.message}</span>
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
