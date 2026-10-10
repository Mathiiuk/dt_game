import React, { useEffect, useState } from 'react'
import { Building, Receipt, Ticket, TrendingDown, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { financesApi } from '../../api/finances'
import { moraleApi } from '../../api/morale'
import { climateApi } from '../../api/climate'
import { ticketPriceWarning, financeSafetyWarning } from '../../domain/warnings'
import { askRisk } from '../../lib/risk'
import { useGameContext } from '../../context/GameContext'
import { queryCache } from '../../utils/cache'
import { formatMoney } from '../../lib/format'
import { FACILITIES, TICKET_PRICES, healthInfo, levelOf, upgradeCost } from '../../domain/finances'
import {
  Badge, Button, Card, CardBody, CardDescription, CardHeader, CardTitle, PageHeader, Skeleton,
  Tabs, TabsContent, TabsList, TabsTrigger
} from '../../components/ui'
import FinancesWalletCard from './FinancesWalletCard'
import WageCapMeter from './WageCapMeter'
import FinancesFacilityCard from './FinancesFacilityCard'
import FinancesTransactionFeed from './FinancesTransactionFeed'
import { friendlyError } from '../../lib/errors'

/** Desglose de ingresos y gastos */
function Breakdown({ title, total, tone, rows, sign }) {
  return (
    <Card as="section" className="border border-line bg-surface/90">
      <CardHeader className="pb-3 border-b border-line/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold font-display text-fg">{title}</CardTitle>
          <p className={`num font-display text-lg font-bold ${tone === 'accent' ? 'text-accent' : 'text-danger'}`}>
            {sign}{formatMoney(total)}
          </p>
        </div>
      </CardHeader>
      <CardBody className="p-4">
        <dl className="divide-y divide-line/60 text-xs">
          {rows.map(([label, value, highlight]) => (
            <div key={label} className={`flex items-center justify-between gap-3 py-2 ${highlight ? 'font-semibold text-fg' : ''}`}>
              <dt className={highlight ? 'text-fg' : 'text-fg-muted'}>{label}</dt>
              <dd className="num font-semibold text-fg">{sign}{formatMoney(value)}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  )
}

export default function FinancesScreen() {
  const { club, confirmAction, confirmRisk, refreshContext } = useGameContext()

  const cached = club?.id ? queryCache.get(`finances:${club.id}`) : null
  const [loading, setLoading] = useState(!cached)
  const [finances, setFinances] = useState(cached || null)
  const [transactions, setTransactions] = useState([])
  const [tab, setTab] = useState('balance')
  const [ticketPrice, setTicketPrice] = useState(10)
  const [updatingTicket, setUpdatingTicket] = useState(false)
  const [check, setCheck] = useState(null)
  const [checking, setChecking] = useState(false)

  const handleVerify = async () => {
    setChecking(true)
    try {
      setCheck(await financesApi.verifyBalance(club.id))
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos verificar el balance. Probá de nuevo.'))
    } finally {
      setChecking(false)
    }
  }

  const loadData = async () => {
    try {
      if (!club?.id) return
      const [fin, txs] = await Promise.all([
        financesApi.getFinances(club.id),
        financesApi.getLedgerTransactions(club.id, 25)
      ])
      setFinances(fin)
      setTransactions(txs)
      setTicketPrice(fin?.ticketPrice || 10)
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!club?.id) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club?.id])

  const handleTicketPrice = async (price) => {
    try {
      setUpdatingTicket(true)
      const proceed = await askRisk(confirmRisk, async () => {
        const streaks = await moraleApi.getStreaks(club.id)
        return ticketPriceWarning({ price, streaks }, climateApi.difficulty)
      })
      if (!proceed) return
      await financesApi.updateTicketPrice(club.id, price)
      toast.success(`Precio de la entrada fijado en ${formatMoney(price)}`)
      setTicketPrice(price)
      loadData()
      if (typeof refreshContext === 'function') await refreshContext()
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setUpdatingTicket(false)
    }
  }

  const handleUpgrade = async (facility) => {
    const level = levelOf(club, facility.key)
    const cost = upgradeCost(facility, level)

    const safetyWarning = financeSafetyWarning({
      cost,
      balance: finances?.balance,
      expectedWeeklyFlow: finances?.expectedWeeklyFlow,
      gameDate: club?.game_date
    })

    if (safetyWarning) {
      const ok = await confirmRisk(safetyWarning)
      if (!ok) return
    } else {
      const confirmed = await confirmAction({
        title: `Mejorar ${facility.name.toLowerCase()}`,
        description: `¿Confirmás la inversión de ${formatMoney(cost)} para llevarla al nivel ${level + 1}?`,
        confirmText: 'Invertir y mejorar',
        cancelText: 'Cancelar',
        variant: 'primary'
      })
      if (!confirmed) return
    }
    try {
      await financesApi.upgradeFacility(club.id, facility.key, cost, level)
      toast.success(`${facility.name} mejorada con éxito`)
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(friendlyError(e))
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Cargando finanzas">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-28" />
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      </div>
    )
  }

  const f = finances
  const health = healthInfo(f?.healthStatus)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8 space-y-6">
      <PageHeader
        eyebrow="Tesorería"
        title="Finanzas"
        description="Balance, flujo semanal de caja e infraestructura del club."
        actions={<Badge tone={health.tone} dot>{health.label}</Badge>}
      />

      {/* 1. Billetera del Club (Caja, Salud Tycoon y Balance Semanal) */}
      <FinancesWalletCard finances={f} check={check} checking={checking} onVerify={handleVerify} />

      {/* 2. Pestañas de Gestión Financiera e Inversiones */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Secciones de finanzas" className="mb-6">
          <TabsTrigger value="balance">Flujo semanal</TabsTrigger>
          <TabsTrigger value="facilities">Instalaciones</TabsTrigger>
          <TabsTrigger value="ledger">Movimientos</TabsTrigger>
        </TabsList>

        {/* Tab 1: Desglose de Ingresos, Gastos y Política de Entradas */}
        <TabsContent value="balance" className="space-y-6">
          <Card as="section" aria-label="Masa salarial" className="border border-line bg-surface/90">
            <CardBody className="p-4 sm:p-6">
              <WageCapMeter bill={(f?.expenses?.playerWages || 0) + (f?.expenses?.staffWages || 0)} cap={f?.wageBudgetWeekly} />
            </CardBody>
          </Card>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Breakdown
              title="Ingresos recurrentes"
              sign="+"
              tone="accent"
              total={f?.income?.totalRecurring || 0}
              rows={[
                ['Cuotas de socios', f?.income?.membersIncome || 0],
                ['Patrocinador principal', f?.income?.sponsorsIncome || 0],
                ['Derechos de televisación', f?.income?.tvIncome || 0],
                ['Tienda y merchandising', f?.income?.storeIncome || 0],
                ['Taquilla estimada (partido local)', f?.income?.projectedMatchdayGate || 0, true]
              ]}
            />
            <Breakdown
              title="Gastos fijos"
              sign="-"
              tone="danger"
              total={f?.expenses?.total || 0}
              rows={[
                ['Nómina del plantel', f?.expenses?.playerWages || 0],
                ['Sueldos del cuerpo técnico', f?.expenses?.staffWages || 0],
                ['Mantenimiento del estadio', f?.expenses?.stadiumMaint || 0],
                ['Mantenimiento de cantera', f?.expenses?.academyMaint || 0]
              ]}
            />
          </div>

          {/* Política de Entradas */}
          <Card as="section" aria-label="Política de entradas" className="border border-line bg-surface/90">
            <CardHeader className="flex-wrap items-center justify-between pb-3 border-b border-line/60">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <Ticket className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold font-display text-fg">Política de entradas</CardTitle>
                  <CardDescription className="text-xs">
                    Precio general: una entrada más cara recauda más pero puede mermar la asistencia.
                  </CardDescription>
                </div>
              </div>
              <p className="num font-display text-2xl font-bold text-amber-400">{formatMoney(ticketPrice)}</p>
            </CardHeader>
            <CardBody className="p-4">
              <div role="radiogroup" aria-label="Precio de la entrada" className="grid grid-cols-5 gap-2">
                {TICKET_PRICES.map((price) => {
                  const active = Math.abs(ticketPrice - price) < 0.1
                  return (
                    <Button
                      key={price}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      variant={active ? 'primary' : 'outline'}
                      disabled={updatingTicket}
                      onClick={() => handleTicketPrice(price)}
                      className="text-xs font-semibold"
                    >
                      ${price}
                    </Button>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        </TabsContent>

        {/* Tab 2: Instalaciones y Obras Estratégicas (Tycoon) */}
        <TabsContent value="facilities">
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FACILITIES.map((facility) => (
              <li key={facility.key}>
                <FinancesFacilityCard
                  facility={facility}
                  club={club}
                  onUpgrade={handleUpgrade}
                  budget={f?.balance || 0}
                />
              </li>
            ))}
          </ul>
        </TabsContent>

        {/* Tab 3: Registro de Movimientos */}
        <TabsContent value="ledger">
          <FinancesTransactionFeed transactions={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
