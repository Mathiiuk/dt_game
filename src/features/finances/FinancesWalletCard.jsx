import React from 'react'
import { AlertCircle, CheckCircle2, Clock, DollarSign, Info, Sparkles, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Card, CardBody, Badge, Button } from '../../components/ui'
import { formatMoney } from '../../lib/format'
import { getTycoonHealth } from '../../domain/finances'

export default function FinancesWalletCard({ finances, check = null, checking = false, onVerify }) {
  const balance = finances?.balance || 0
  const net = finances?.netWeeklyFlow || 0
  const totalIncome = finances?.income?.totalRecurring || 0
  const totalExpenses = finances?.expenses?.total || 0
  const profitable = net >= 0

  const tycoonHealth = getTycoonHealth(finances?.healthStatus, balance, totalExpenses)

  return (
    <Card className="border border-line bg-surface/90 shadow-sm overflow-hidden mb-6">
      {/* Cabecera Tycoon con Semáforo y Lema */}
      <div className="bg-gradient-to-r from-accent/15 via-accent/5 to-transparent px-4 py-3 sm:px-6 border-b border-line flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent/20 text-accent border border-accent/30">
            <Wallet className="size-5" />
          </div>
          <div>
            <span className="eyebrow text-accent">Billetera del club</span>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-fg sm:text-xl">
                Caja del club
              </h2>
            </div>
          </div>
        </div>

        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border shadow-xs ${tycoonHealth.badgeClass}`}>
          {tycoonHealth.slogan}
        </span>
      </div>

      <CardBody className="p-4 sm:p-6 space-y-5">
        {/* Monto Principal de Caja y Margen */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-line pb-4">
          <div>
            <span className="eyebrow text-xs">Caja disponible hoy</span>
            <div className="font-display text-3xl font-black text-accent sm:text-4xl mt-0.5 tracking-tight">
              {formatMoney(balance)}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-fg-muted bg-surface-2 px-3 py-1.5 rounded-xl border border-line">
            <Clock className="size-4 text-fg-subtle shrink-0" />
            <span>{finances?.liquidityWeeks || tycoonHealth.runwayWeeks}</span>
          </div>
        </div>

        {onVerify && (
          <div className="flex flex-wrap items-start gap-3 border-b border-line pb-4">
            <Button size="sm" variant="outline" onClick={onVerify} loading={checking}>{!checking && <CheckCircle2 />}Verificar balance</Button>
            {check && (
              <p role="status" className={`flex min-w-0 flex-1 items-start gap-2 text-xs leading-relaxed ${check.status === 'OK' ? 'text-accent' : 'text-fg-muted'}`}>
                {check.status === 'OK' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
                <span>{check.message}</span>
              </p>
            )}
          </div>
        )}

        {/* Balance Semanal y Flujo de Caja */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-2/80 p-3.5 border border-line">
            <span className="eyebrow text-[10px]">Entró esta semana</span>
            <div className="font-display text-lg font-bold text-emerald-400 mt-1">
              +{formatMoney(totalIncome)}
            </div>
            <p className="text-[11px] text-fg-subtle mt-0.5">Socios, sponsors y TV</p>
          </div>

          <div className="rounded-xl bg-surface-2/80 p-3.5 border border-line">
            <span className="eyebrow text-[10px]">Gastamos esta semana</span>
            <div className="font-display text-lg font-bold text-rose-400 mt-1">
              -{formatMoney(totalExpenses)}
            </div>
            <p className="text-[11px] text-fg-subtle mt-0.5">Sueldos y mantenimiento</p>
          </div>

          <div className="rounded-xl bg-surface-2/80 p-3.5 border border-line">
            <span className="eyebrow text-[10px]">Balance de la semana</span>
            <div className={`font-display text-lg font-bold mt-1 flex items-center gap-1.5 ${profitable ? 'text-accent' : 'text-danger'}`}>
              {profitable ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              {profitable ? '+' : ''}{formatMoney(net)}
            </div>
            <p className="text-[11px] text-fg-subtle mt-0.5">
              {profitable ? 'Superávit operativo' : 'Déficit semanal cubierto'}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
