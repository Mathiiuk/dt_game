import React, { useEffect, useState } from 'react'
import { Building, Clock, Receipt, ShieldPlus, ShoppingBag, Ticket, TrendingDown, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { financesApi } from '../../api/finances'
import { moraleApi } from '../../api/morale'
import { climateApi } from '../../api/climate'
import { ticketPriceWarning } from '../../domain/warnings'
import { askRisk } from '../../lib/risk'
import { useGameContext } from '../../context/GameContext'
import { queryCache } from '../../utils/cache'
import { formatMoney } from '../../lib/format'
import { FACILITIES, TICKET_PRICES, healthInfo, levelOf, storeWeeklyIncome, upgradeCost } from '../../domain/finances'
import {
  Badge, Button, Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle, EmptyState, PageHeader, Skeleton, Stat,
  Tabs, TabsContent, TabsList, TabsTrigger
} from '../../components/ui'
import { friendlyError } from '../../lib/errors'

const FACILITY_ICONS = { stadium_level: Building, medical_level: ShieldPlus, store_level: ShoppingBag }

/** Lista de conceptos con su monto; el total va resaltado al pie */
function Breakdown({ title, total, tone, rows, sign }) {
  return (
    <Card as="section">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className={`num font-display text-xl font-semibold ${tone === 'accent' ? 'text-accent' : 'text-danger'}`}>
          {sign}{formatMoney(total)}
        </p>
      </CardHeader>
      <CardBody>
        <dl className="divide-y divide-line text-sm">
          {rows.map(([label, value, highlight]) => (
            <div key={label} className={`flex items-center justify-between gap-3 py-2.5 ${highlight ? 'font-semibold text-fg' : ''}`}>
              <dt className={highlight ? 'text-fg' : 'text-fg-muted'}>{label}</dt>
              <dd className="num font-medium text-fg">{sign}{formatMoney(value)}</dd>
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
      // Cobrar caro con el equipo sin ganar enoja a la hinchada: se avisa antes de fijar el precio
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
    const confirmed = await confirmAction({
      title: `Mejorar ${facility.name.toLowerCase()}`,
      description: `¿Confirmás la inversión de ${formatMoney(cost)} para llevarla al nivel ${level + 1}?`,
      confirmText: 'Invertir y mejorar',
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return
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
  const net = f?.netWeeklyFlow || 0
  const profitable = net >= 0
  const health = healthInfo(f?.healthStatus)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow="Tesorería"
        title="Finanzas"
        description="Balance, flujo semanal de caja e infraestructura del club."
        actions={<Badge tone={health.tone} dot>{health.label}</Badge>}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Secciones de finanzas" className="mb-6">
          <TabsTrigger value="balance">Flujo semanal</TabsTrigger>
          <TabsTrigger value="facilities">Instalaciones</TabsTrigger>
          <TabsTrigger value="ledger">Libro mayor</TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Stat label="Caja" value={formatMoney(f?.balance || 0)} hint="Saldo bancario líquido" valueClassName="text-accent" />
              <Stat
                label="Flujo neto semanal"
                value={<span className="inline-flex items-center gap-2">{profitable ? <TrendingUp className="size-6 text-accent" aria-hidden="true" /> : <TrendingDown className="size-6 text-danger" aria-hidden="true" />}{profitable ? '+' : ''}{formatMoney(net)}</span>}
                hint="Estimación entre fechas de liga"
                valueClassName={profitable ? 'text-accent' : 'text-danger'}
              />
              <Stat
                label="Respaldo de liquidez"
                value={<span className="inline-flex items-center gap-2"><Clock className="size-6 text-fg-muted" aria-hidden="true" />{f?.liquidityWeeks}</span>}
                hint="Autonomía sin ingresos extra"
              />
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

          <Card as="section" aria-label="Política de entradas">
            <CardHeader className="flex-wrap items-center">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-md bg-gold-soft text-gold"><Ticket className="size-5" aria-hidden="true" /></span>
                <div>
                  <CardTitle className="text-lg">Política de entradas</CardTitle>
                  <CardDescription>Precio general de la entrada: más caro rinde más, pero puede espantar a la hinchada.</CardDescription>
                </div>
              </div>
              <p className="num font-display text-2xl font-semibold text-gold">{formatMoney(ticketPrice)}</p>
            </CardHeader>
            <CardBody>
              <div role="radiogroup" aria-label="Precio de la entrada" className="grid grid-cols-5 gap-2">
                {TICKET_PRICES.map(price => {
                  const active = Math.abs(ticketPrice - price) < 0.1
                  return (
                    <Button
                      key={price}
                      role="radio"
                      aria-checked={active}
                      variant={active ? 'primary' : 'outline'}
                      disabled={updatingTicket}
                      onClick={() => handleTicketPrice(price)}
                    >
                      ${price}
                    </Button>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="facilities">
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FACILITIES.map(facility => {
              const Icon = FACILITY_ICONS[facility.key]
              const level = levelOf(club, facility.key)
              const cost = upgradeCost(facility, level)
              const extra = facility.key === 'stadium_level'
                ? `Capacidad ${Number(club?.stadium_capacity || 1000).toLocaleString('es-AR')}`
                : facility.key === 'store_level' ? `+${formatMoney(storeWeeklyIncome(level))}/sem` : 'Recuperación pasiva'
              return (
                <li key={facility.key}>
                  <Card as="article" className="flex h-full flex-col">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-md bg-surface-3 text-fg-muted"><Icon className="size-5" aria-hidden="true" /></span>
                        <div>
                          <CardTitle as="h3" className="text-lg">{facility.name}</CardTitle>
                          <CardDescription>Nivel {level} · {extra}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody className="flex-1">
                      <p className="text-sm text-fg-muted">{facility.description}</p>
                    </CardBody>
                    <CardFooter>
                      <Button className="w-full" variant="outline" onClick={() => handleUpgrade(facility)}>
                        {facility.action} · {formatMoney(cost)}
                      </Button>
                    </CardFooter>
                  </Card>
                </li>
              )
            })}
          </ul>
        </TabsContent>

        <TabsContent value="ledger">
          <Card as="section" aria-label="Libro mayor">
            <CardHeader className="items-center">
              <div>
                <CardTitle className="text-lg">Libro mayor</CardTitle>
                <CardDescription>Registro inmutable de movimientos financieros</CardDescription>
              </div>
              <span className="text-xs text-fg-subtle">{transactions.length} registros</span>
            </CardHeader>
            <CardBody>
              {transactions.length === 0 ? (
                <EmptyState icon={Receipt} title="Sin movimientos" description="Los débitos y créditos se anotan durante los avances semanales y traspasos." className="py-8" />
              ) : (
                <>
                  {/* Móvil: una fila por movimiento */}
                  <ul className="divide-y divide-line md:hidden">
                    {transactions.map(tx => {
                      const income = Number(tx.amount) >= 0
                      return (
                        <li key={tx.id} className="flex items-start justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-fg">{tx.description}</p>
                            <p className="text-xs text-fg-subtle">Semana {tx.week_number} · Saldo {formatMoney(tx.balance_after)}</p>
                          </div>
                          <p className={`num shrink-0 font-semibold ${income ? 'text-accent' : 'text-danger'}`}>{income ? '+' : ''}{formatMoney(tx.amount)}</p>
                        </li>
                      )
                    })}
                  </ul>
                  <table className="hidden w-full text-left text-sm md:table" aria-label="Movimientos contables">
                    <thead>
                      <tr className="border-b border-line text-fg-subtle">
                        <th scope="col" className="eyebrow pb-2.5">Semana</th>
                        <th scope="col" className="eyebrow pb-2.5">Descripción</th>
                        <th scope="col" className="eyebrow pb-2.5 text-right">Monto</th>
                        <th scope="col" className="eyebrow pb-2.5 text-right">Saldo posterior</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {transactions.map(tx => {
                        const income = Number(tx.amount) >= 0
                        return (
                          <tr key={tx.id}>
                            <td className="num py-2.5 text-fg-muted">Sem {tx.week_number}</td>
                            <td className="py-2.5 font-medium text-fg">{tx.description}</td>
                            <td className={`num py-2.5 text-right font-semibold ${income ? 'text-accent' : 'text-danger'}`}>{income ? '+' : ''}{formatMoney(tx.amount)}</td>
                            <td className="num py-2.5 text-right text-fg-muted">{formatMoney(tx.balance_after)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
